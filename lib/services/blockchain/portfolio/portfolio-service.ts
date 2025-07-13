import { graphQLRequest } from '@/lib/utils/fetch-utils';
// import { getCachedData, setCachedData } from '@/lib/utils/cache-manager';
import { logger } from '@/lib/utils/logger';
import { PriceService } from '@/lib/trpc/domains/market-data/prices/services'; // TODO: Move PriceService to /lib/services/
import { PanoraService, type PanoraPriceResponse } from './panora-service';
import { phantomDetector } from './phantom-detection';
import {
  getProtocolByAddress,
  getProtocolLabel,
  isPhantomAsset,
  shouldShowProtocolBadge,
} from '@/lib/protocol-registry';
import {
  LEGITIMATE_STABLECOINS,
  SCAM_TOKENS,
  AptosValidators,
} from '@/lib/aptos-constants';
import { getEnvVar } from '@/lib/config/validate-env';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const APTOS_API_KEY = getEnvVar('APTOS_BUILD_SECRET');

export interface FungibleAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
  price?: number;
  value?: number;
  balance?: number;
  isVerified?: boolean;
  protocolInfo?: {
    protocol: string;
    protocolLabel: string;
    protocolType: string;
    isPhantomAsset: boolean;
  };
}

export interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  property_version_v1: number;
  amount: number;
  cdn_image_uri?: string;
  cdn_animation_uri?: string;
  collection_description?: string;
  creator_address?: string;
  collection_uri?: string;
  last_transaction_version?: number;
  last_transaction_timestamp?: string;
}

interface PortfolioHistoryPoint {
  date: string;
  totalValue: number;
  assets: {
    assetType: string;
    symbol: string;
    balance: number;
    value: number;
    price: number;
  }[];
}

interface AssetPrice {
  assetType: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap?: number;
}

interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  assetAllocation: {
    assetType: string;
    symbol: string;
    value: number;
    percentage: number;
  }[];
  topGainers: AssetPrice[];
  topLosers: AssetPrice[];
}

interface WalletTransaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  entry_function_id_str?: string;
  is_transaction_success: boolean;
  gas_fee_payer_address?: string;
}

// Query to get all fungible assets (both v1 and v2) for a wallet
// Note: We query both FA and Coin balances due to the migration from Coin to FA standard
// Some tokens might appear in both tables during migration
const WALLET_ASSETS_QUERY = `
  query GetWalletAssets($ownerAddress: String!) {
    current_fungible_asset_balances(
      where: { 
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: "0" }
      }
    ) {
      amount
      asset_type
      metadata {
        name
        symbol
        decimals
        icon_uri
      }
    }
    current_coin_balances(
      where: { 
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: "0" }
      }
    ) {
      amount
      coin_type
      coin_info {
        name
        symbol
        decimals
      }
    }
  }
`;

// Query to get both fungible asset and coin activities for historical balance tracking
const HISTORICAL_ACTIVITIES_QUERY = `
  query GetHistoricalActivities($ownerAddress: String!, $startTime: timestamp!) {
    fungible_asset_activities(
      where: { 
        owner_address: { _eq: $ownerAddress },
        transaction_timestamp: { _gte: $startTime }
      }
      order_by: { transaction_timestamp: desc }
    ) {
      transaction_version
      transaction_timestamp
      type
      amount
      asset_type
      entry_function_id_str
      block_height
      is_transaction_success
    }
    coin_activities(
      where: { 
        owner_address: { _eq: $ownerAddress },
        transaction_timestamp: { _gte: $startTime }
      }
      order_by: { transaction_timestamp: desc }
    ) {
      transaction_version
      transaction_timestamp
      activity_type
      amount
      coin_type
      entry_function_id_str
      block_height
      is_transaction_success
    }
  }
`;

// Query to get recent transactions for a wallet
const WALLET_TRANSACTIONS_QUERY = `
  query GetWalletTransactions($ownerAddress: String!, $limit: Int!) {
    fungible_asset_activities(
      where: { 
        owner_address: { _eq: $ownerAddress }
      }
      order_by: { transaction_timestamp: desc }
      limit: $limit
    ) {
      transaction_version
      transaction_timestamp
      type
      amount
      asset_type
      entry_function_id_str
      is_transaction_success
      gas_fee_payer_address
    }
  }
`;

// Query to get NFTs for a wallet (including CELL tokens which are actually NFTs)
const WALLET_NFTS_QUERY = `
  query GetWalletNFTs($ownerAddress: String!, $limit: Int!, $offset: Int!) {
    current_token_ownerships_v2(
      where: { 
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: 0 },
        _or: [
          { current_token_data: { token_standard: { _eq: "v2" } } },
          { current_token_data: { token_name: { _ilike: "%CELL%" } } },
          { current_token_data: { token_name: { _ilike: "%Cellana%" } } }
        ]
      }
      limit: $limit
      offset: $offset
    ) {
      current_token_data {
        token_data_id
        token_name
        description
        token_uri
        cdn_asset_uris {
          cdn_image_uri
          cdn_animation_uri
        }
        current_collection {
          collection_name
          description
          creator_address
          uri
        }
      }
      property_version_v1
      amount
      last_transaction_version
      last_transaction_timestamp
    }
  }
`;

export async function getWalletAssets(
  walletAddress: string,
  showOnlyVerified: boolean = true
): Promise<FungibleAsset[]> {
  try {
    // Validate wallet address format first (enterprise-grade validation)
    const addressValidation = AptosValidators.validateAddress(walletAddress);
    if (!addressValidation.isValid) {
      logger.error(`Invalid wallet address format: ${walletAddress}`, {
        error: addressValidation.error,
      });
      throw new Error(`Invalid wallet address: ${addressValidation.error}`);
    }

    logger.info(
      `Fetching wallet assets for ${walletAddress} from Aptos indexer (showOnlyVerified: ${showOnlyVerified})`
    );

    // Log if API key is missing
    if (!APTOS_API_KEY) {
      logger.warn(
        'APTOS_BUILD_SECRET not configured - GraphQL queries may fail'
      );
    }

    const response = await graphQLRequest<{
      current_fungible_asset_balances: FungibleAsset[];
      current_coin_balances: Array<{
        amount: string;
        coin_type: string;
        coin_info: {
          name: string;
          symbol: string;
          decimals: number;
        };
      }>;
    }>(
      INDEXER,
      {
        query: WALLET_ASSETS_QUERY,
        variables: { ownerAddress: walletAddress },
      },
      APTOS_API_KEY
        ? {
            headers: {
              Authorization: `Bearer ${APTOS_API_KEY}`,
            },
          }
        : {}
    );

    logger.debug(`GraphQL response received:`, {
      fungibleAssetsCount:
        response.current_fungible_asset_balances?.length || 0,
      coinBalancesCount: response.current_coin_balances?.length || 0,
    });

    // Combine fungible assets and coin balances, but filter out CELL tokens (they're NFTs)
    const fungibleAssets = (
      response.current_fungible_asset_balances || []
    ).filter(
      asset =>
        !asset.metadata?.symbol?.includes('CELL') &&
        asset.asset_type !==
          '0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12'
    );
    const coinBalances = (response.current_coin_balances || []).filter(
      coin =>
        !coin.coin_info?.symbol?.includes('CELL') &&
        coin.coin_type !==
          '0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12'
    );

    // Create a set of symbols that already exist in FA balances
    // This helps us avoid duplicates from the Coin->FA migration
    const faSymbols = new Set(
      fungibleAssets.map(asset => asset.metadata?.symbol).filter(Boolean)
    );

    logger.debug(
      `After CELL filtering: ${fungibleAssets.length} fungible assets, ${coinBalances.length} coin balances`
    );

    // Get Panora token list - this will be our source of truth for official tokens
    let panoraTokens: PanoraPriceResponse[] = [];
    let panoraAvailable = false;
    try {
      panoraTokens = await PanoraService.getAllPrices();
      panoraAvailable = panoraTokens.length > 0;
      logger.debug(`Panora returned ${panoraTokens.length} official tokens`);
    } catch (error) {
      logger.warn(
        'Failed to fetch Panora tokens, continuing without price data',
        error
      );
      panoraAvailable = false;
    }
    const panoraTokenMap = new Map(
      panoraTokens.map(token => {
        // Use Panora's iconUrl if available, otherwise use local icons or construct GitHub URL
        let iconUrl = token.iconUrl;

        if (!iconUrl) {
          const symbol = token.symbol.toLowerCase();

          // Try local icons first for common tokens
          if (symbol === 'apt' || symbol === 'aptos') {
            iconUrl = '/icons/apt.png';
          } else if (symbol === 'usdc') {
            iconUrl = '/icons/stables/usdc.png';
          } else if (symbol === 'usdt') {
            iconUrl = '/icons/stables/usdt.png';
          } else if (symbol === 'wbtc' || symbol === 'btc') {
            iconUrl = '/icons/btc/bitcoin.png';
          } else if (symbol === 'stapt' || symbol === 'st-apt') {
            iconUrl = '/icons/lst/amnis-stAPT.jpeg';
          } else {
            // Try to construct Panora GitHub URL
            // Try different extensions
            iconUrl = `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${token.symbol}.svg`;
          }
        }

        return [token.faAddress || token.tokenAddress, { ...token, iconUrl }];
      })
    );

    // Create a set of official token addresses for reference (but don't filter by it)
    const officialTokenAddresses = new Set(
      panoraTokens
        .map(token => token.faAddress || token.tokenAddress)
        .filter(Boolean)
    );

    // Convert coin balances to FungibleAsset format and add icon URIs
    // Filter out coins that already exist in FA balances to avoid duplicates
    const convertedCoins: FungibleAsset[] = coinBalances
      .filter(coin => {
        // Skip if this symbol already exists in FA balances (avoid duplicates from Coin->FA migration)
        if (faSymbols.has(coin.coin_info.symbol)) {
          logger.info(
            `Skipping coin ${coin.coin_info.symbol} as it already exists in FA balances`
          );
          return false;
        }

        return true;
      })
      .map(coin => ({
        asset_type: coin.coin_type,
        amount: coin.amount,
        metadata: {
          name: coin.coin_info.name,
          symbol: coin.coin_info.symbol,
          decimals: coin.coin_info.decimals,
          icon_uri: panoraTokenMap.get(coin.coin_type)?.iconUrl,
        },
      }));

    // Add icon URIs to fungible assets from Panora
    // Include all assets, but mark whether they're official
    const enhancedFungibleAssets: FungibleAsset[] = fungibleAssets.map(
      asset => ({
        ...asset,
        metadata: asset.metadata
          ? {
              ...asset.metadata,
              icon_uri:
                asset.metadata.icon_uri ||
                panoraTokenMap.get(asset.asset_type)?.iconUrl,
            }
          : {
              name: 'Unknown',
              symbol: 'Unknown',
              decimals: 8,
              icon_uri: panoraTokenMap.get(asset.asset_type)?.iconUrl,
            },
      })
    );

    let allAssets = [...enhancedFungibleAssets, ...convertedCoins];

    // First, filter out known scam tokens
    const beforeScamFilter = allAssets.length;
    allAssets = allAssets.filter(asset => {
      if (SCAM_TOKENS.has(asset.asset_type)) {
        logger.warn(
          `Filtering out known scam token: ${asset.metadata?.symbol} - ${asset.metadata?.name} (${asset.asset_type})`
        );
        return false;
      }
      return true;
    });

    if (beforeScamFilter !== allAssets.length) {
      logger.info(
        `Filtered out ${beforeScamFilter - allAssets.length} known scam tokens`
      );
    }

    logger.info(
      `Found ${allAssets.length} total assets (${enhancedFungibleAssets.length} fungible + ${convertedCoins.length} coins) for wallet ${walletAddress} after scam filtering.`
    );

    // Build a set of verified Panora addresses for filtering
    const verifiedAddresses = new Set<string>();
    panoraTokens.forEach(token => {
      if (token.faAddress) verifiedAddresses.add(token.faAddress);
      if (token.tokenAddress) verifiedAddresses.add(token.tokenAddress);
    });

    // Always include core tokens regardless of Panora availability
    const coreTokens = new Set([
      '0x1::aptos_coin::AptosCoin', // APT
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC', // LayerZero USDC
      '0x397071c01929cc6672a17f130bd62b1bce224309029837ce4f18214cc83ce2a7::USDC::USDC', // Another USDC variant
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // LayerZero USDT
    ]);

    // Add common token variations that should be included
    coreTokens.forEach(token => verifiedAddresses.add(token));

    // Use centralized legitimate stablecoin addresses from aptos-constants.ts (single source of truth)

    // Function to determine if a token is a stablecoin based on symbol/name
    const isStablecoin = (asset: FungibleAsset): boolean => {
      const symbol = asset.metadata?.symbol?.toLowerCase() || '';
      const name = asset.metadata?.name?.toLowerCase() || '';

      // Check if it contains stablecoin indicators
      return (
        symbol.includes('usd') ||
        name.includes('usd') ||
        symbol.includes('usdc') ||
        symbol.includes('usdt') ||
        symbol.includes('usde') ||
        symbol.includes('dai') ||
        symbol.includes('busd') ||
        symbol.includes('tusd') ||
        name.includes('dollar') ||
        name.includes('stable')
      );
    };

    // Function to check if a token has scam indicators
    const hasScamIndicators = (asset: FungibleAsset): boolean => {
      const name = asset.metadata?.name || '';
      const symbol = asset.metadata?.symbol || '';

      // Check for common scam patterns
      return (
        name.includes('💸') || // Money emoji
        name.includes('🚀') || // Rocket emoji
        name.includes('💰') || // Money bag emoji
        name.includes('💎') || // Diamond emoji
        name.includes('.com') || // Domain names
        name.includes('.org') || // Domain names
        name.includes('.net') || // Domain names
        name.includes('airdrop') || // Airdrop scams
        name.includes('claim') || // Claim scams
        name.includes('free') || // Free token scams
        name.toLowerCase().includes('gift') || // Gift scams
        (name.includes('APT') && name.includes('claim')) || // APT claim scams
        symbol === '$APT' // Fake APT symbols
      );
    };

    // Function to check if it's a fake APT token
    const isFakeAPT = (asset: FungibleAsset): boolean => {
      const symbol = asset.metadata?.symbol?.toUpperCase() || '';
      const name = asset.metadata?.name?.toLowerCase() || '';

      // If it claims to be APT but isn't the official address, it's fake
      if (
        (symbol === 'APT' ||
          symbol === 'APTOS' ||
          name.includes('aptos coin')) &&
        asset.asset_type !== '0x1::aptos_coin::AptosCoin'
      ) {
        return true;
      }

      return false;
    };

    // Filter assets: for stablecoins, only show legitimate ones; for non-stablecoins, only show verified ones by default
    let assetsToProcess: FungibleAsset[];

    if (showOnlyVerified) {
      // Show only verified Panora tokens, but filter stablecoins to legitimate ones
      assetsToProcess = allAssets.filter(asset => {
        // Always filter out tokens with scam indicators
        if (hasScamIndicators(asset)) {
          logger.warn(
            `Filtering out scam token: ${asset.metadata?.symbol} - ${asset.metadata?.name} (${asset.asset_type})`
          );
          return false;
        }

        // Filter out fake APT tokens
        if (isFakeAPT(asset)) {
          logger.warn(
            `Filtering out fake APT token: ${asset.metadata?.symbol} - ${asset.metadata?.name} (${asset.asset_type})`
          );
          return false;
        }

        // If it's a stablecoin, only show if it's legitimate
        if (isStablecoin(asset)) {
          const isLegitimate = LEGITIMATE_STABLECOINS.has(asset.asset_type);
          if (!isLegitimate) {
            logger.warn(
              `Filtering out scam stablecoin: ${asset.metadata?.symbol} (${asset.asset_type})`
            );
          }
          return isLegitimate;
        }

        // Always include core tokens
        if (coreTokens.has(asset.asset_type)) {
          return true;
        }

        // If Panora is not available, show all non-stablecoin tokens (except scams)
        if (!panoraAvailable) {
          logger.debug(
            `Panora not available, including token: ${asset.metadata?.symbol}`
          );
          return true;
        }

        // For non-stablecoins, show if verified by Panora
        const isVerified = verifiedAddresses.has(asset.asset_type);
        return isVerified;
      });
    } else {
      // Show all non-stablecoins and legitimate stablecoins
      assetsToProcess = allAssets.filter(asset => {
        // Always filter out tokens with scam indicators
        if (hasScamIndicators(asset)) {
          logger.warn(
            `Filtering out scam token: ${asset.metadata?.symbol} - ${asset.metadata?.name} (${asset.asset_type})`
          );
          return false;
        }

        // Filter out fake APT tokens
        if (isFakeAPT(asset)) {
          logger.warn(
            `Filtering out fake APT token: ${asset.metadata?.symbol} - ${asset.metadata?.name} (${asset.asset_type})`
          );
          return false;
        }

        // If it's a stablecoin, only show if it's legitimate
        if (isStablecoin(asset)) {
          const isLegitimate = LEGITIMATE_STABLECOINS.has(asset.asset_type);
          if (!isLegitimate) {
            logger.warn(
              `Filtering out scam stablecoin: ${asset.metadata?.symbol} (${asset.asset_type})`
            );
          }
          return isLegitimate;
        }

        // For non-stablecoins, show all when verified filter is disabled
        return true;
      });
    }

    logger.info(
      showOnlyVerified
        ? `Filtered to ${assetsToProcess.length} verified tokens (with stablecoin filtering) from ${allAssets.length} total assets`
        : `Showing ${assetsToProcess.length} assets (all tokens with stablecoin filtering) from ${allAssets.length} total assets`
    );

    // Get prices for assets - for unverified assets, prices might be 0
    const assetTypes = assetsToProcess.map(a => a.asset_type);
    const priceData = await getAssetPrices(assetTypes);

    // Enhance assets with price and value information
    const assetsWithPrices = assetsToProcess.map(asset => {
      // Validate asset type format for enterprise-grade safety
      const assetValidation = AptosValidators.validateAssetType(
        asset.asset_type
      );
      if (!assetValidation.isValid) {
        logger.warn(`Invalid asset type format detected: ${asset.asset_type}`, {
          error: assetValidation.error,
        });
        // Continue processing but log the issue for monitoring
      }

      const priceInfo = priceData.find(p => p.assetType === asset.asset_type);
      const price = priceInfo?.price || 0;
      const decimals = asset.metadata?.decimals || 8;

      // FIXED: Use parseFloat for financial precision (was parseInt before)
      const balance = parseFloat(asset.amount) / Math.pow(10, decimals);
      const value = balance * price;

      // Add a flag to indicate if this is a verified token
      const isVerified = verifiedAddresses.has(asset.asset_type);

      // Add protocol information - only for DeFi protocols where assets are inside TVL
      const protocol = getProtocolByAddress(asset.asset_type);
      const protocolInfo =
        protocol && shouldShowProtocolBadge(protocol)
          ? {
              protocol: protocol.name,
              protocolLabel: protocol.label,
              protocolType: protocol.type,
              isPhantomAsset: isPhantomAsset(asset.asset_type, asset.metadata),
            }
          : undefined;

      return {
        ...asset,
        price,
        value,
        balance,
        isVerified,
        protocolInfo,
      };
    });

    // Sort assets by value (highest first), then by balance if values are equal
    const sortedAssets = assetsWithPrices.sort((a, b) => {
      // First sort by USD value (highest first)
      if (b.value !== a.value) {
        return b.value - a.value;
      }

      // If values are equal (both 0 or same value), sort by balance
      return b.balance - a.balance;
    });

    return sortedAssets;
  } catch (error) {
    logger.error('Failed to fetch wallet assets - detailed error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      walletAddress,
      indexerUrl: INDEXER,
    });
    throw new Error(
      `Failed to fetch wallet assets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getPortfolioHistory(
  walletAddress: string,
  days: number = 30
): Promise<PortfolioHistoryPoint[]> {
  try {
    logger.info(
      `Generating 30-day portfolio history for wallet: ${walletAddress}`
    );

    // Validate wallet address
    const addressValidation = AptosValidators.validateAddress(walletAddress);
    if (!addressValidation.isValid) {
      logger.error(`Invalid wallet address: ${walletAddress}`);
      throw new Error(`Invalid wallet address: ${walletAddress} - ${addressValidation.error}`);
    }

    // Step 1: Get ALL historical activities for the past 30+ days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days + 5)); // Get a few extra days for safety
    const startTimestamp = startDate.toISOString();

    logger.info(`Fetching transaction history from ${startTimestamp}`);

    const activitiesResponse = await graphQLRequest<{
      fungible_asset_activities: Array<{
        transaction_timestamp: string;
        type: string;
        amount: string;
        asset_type: string;
        is_transaction_success: boolean;
      }>;
      coin_activities: Array<{
        transaction_timestamp: string;
        activity_type: string;
        amount: string;
        coin_type: string;
        is_transaction_success: boolean;
      }>;
    }>(
      INDEXER,
      {
        query: HISTORICAL_ACTIVITIES_QUERY,
        variables: { ownerAddress: walletAddress, startTime: startTimestamp },
      },
      APTOS_API_KEY
        ? { headers: { Authorization: `Bearer ${APTOS_API_KEY}` } }
        : {}
    );

    // Step 2: Normalize and sort all activities chronologically
    const allActivities = [
      ...activitiesResponse.fungible_asset_activities.map(activity => ({
        timestamp: activity.transaction_timestamp,
        type: activity.type,
        amount: BigInt(activity.amount),
        assetType: activity.asset_type,
        success: activity.is_transaction_success,
      })),
      ...activitiesResponse.coin_activities.map(activity => ({
        timestamp: activity.transaction_timestamp,
        type: activity.activity_type,
        amount: BigInt(activity.amount),
        assetType: activity.coin_type,
        success: activity.is_transaction_success,
      })),
    ]
      .filter(activity => activity.success)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    logger.info(`Found ${allActivities.length} successful activities`);

    // Step 3: Get current prices for all unique assets
    const uniqueAssets = [...new Set(allActivities.map(a => a.assetType))];
    const priceData = await getAssetPrices(uniqueAssets);
    const priceMap = new Map(priceData.map(p => [p.assetType, p.price]));

    // Step 4: Generate daily snapshots
    const history: PortfolioHistoryPoint[] = [];
    const now = new Date();

    for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - dayOffset);
      targetDate.setHours(23, 59, 59, 999); // End of day

      const dailyBalances = calculateBalancesAtDate(allActivities, targetDate);
      const dailyValue = calculatePortfolioValue(dailyBalances, priceMap);

      history.push({
        date: targetDate.toISOString().split('T')[0],
        totalValue: dailyValue.totalValue,
        assets: dailyValue.assets,
      });
    }

    logger.info(`Generated ${history.length} daily portfolio snapshots`);
    return history;
  } catch (error) {
    logger.error('Failed to generate portfolio history:', error);
    throw new Error(`Failed to generate portfolio history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to calculate balances at a specific date
function calculateBalancesAtDate(
  activities: Array<{
    timestamp: string;
    type: string;
    amount: bigint;
    assetType: string;
  }>,
  targetDate: Date
): Map<string, bigint> {
  const balances = new Map<string, bigint>();

  // Process all activities up to the target date
  for (const activity of activities) {
    const activityDate = new Date(activity.timestamp);
    if (activityDate <= targetDate) {
      const currentBalance = balances.get(activity.assetType) || BigInt(0);

      // Determine if this is a credit or debit
      const isCredit =
        activity.type.includes('deposit') ||
        activity.type.includes('mint') ||
        activity.type.includes('receive');

      if (isCredit) {
        balances.set(activity.assetType, currentBalance + activity.amount);
      } else {
        const newBalance = currentBalance - activity.amount;
        balances.set(
          activity.assetType,
          newBalance >= 0 ? newBalance : BigInt(0)
        );
      }
    }
  }

  return balances;
}

// Helper function to calculate total portfolio value from balances
function calculatePortfolioValue(
  balances: Map<string, bigint>,
  priceMap: Map<string, number>
): { totalValue: number; assets: any[] } {
  let totalValue = 0;
  const assets: any[] = [];

  for (const [assetType, balance] of balances.entries()) {
    if (balance <= 0) continue;

    const price = priceMap.get(assetType) || 0;
    const balanceFormatted = Number(balance) / Math.pow(10, 8); // Assume 8 decimals for now
    const value = balanceFormatted * price;

    if (value > 0.01) {
      // Only include assets worth more than 1 cent
      totalValue += value;
      assets.push({
        assetType,
        symbol: assetType.split('::').pop() || 'Unknown',
        balance: balanceFormatted,
        price,
        value,
      });
    }
  }

  return { totalValue, assets };
}

// Helper function to reconstruct portfolio state at a specific date
async function reconstructPortfolioAtDate(
  walletAddress: string,
  targetTimestamp: string,
  currentAssets: FungibleAsset[],
  activities: Array<{
    transaction_timestamp: string;
    type: string;
    amount: string;
    asset_type: string;
    is_transaction_success: boolean;
  }>,
  priceData: AssetPrice[]
): Promise<{ totalValue: number; assets: any[] }> {
  try {
    // Start with current balances and work backwards
    const balanceMap = new Map<string, bigint>();

    // Initialize with current balances
    currentAssets.forEach(asset => {
      balanceMap.set(asset.asset_type, BigInt(asset.amount));
    });

    // Sort activities by timestamp for proper chronological processing
    const sortedActivities = activities
      .filter(activity => activity.is_transaction_success)
      .sort(
        (a, b) =>
          new Date(a.transaction_timestamp).getTime() -
          new Date(b.transaction_timestamp).getTime()
      );

    // Apply activities in reverse chronological order to reconstruct past state
    sortedActivities
      .filter(activity => activity.transaction_timestamp > targetTimestamp)
      .reverse() // Process in reverse chronological order (newest to oldest)
      .forEach(activity => {
        const currentBalance = balanceMap.get(activity.asset_type) || BigInt(0);
        const activityAmount = BigInt(activity.amount);

        // Reverse the activity to get the state at target date
        // More comprehensive activity type handling
        if (
          activity.type.includes('deposit') ||
          activity.type.includes('mint') ||
          activity.type.includes('receive') ||
          activity.type.includes('0x1::coin::deposit') ||
          activity.type.includes('0x1::fungible_asset::deposit')
        ) {
          // If there was a deposit/mint/receive after target date, subtract it to get past state
          const newBalance = currentBalance - activityAmount;
          balanceMap.set(
            activity.asset_type,
            newBalance >= 0 ? newBalance : BigInt(0)
          );
        } else if (
          activity.type.includes('withdraw') ||
          activity.type.includes('transfer') ||
          activity.type.includes('send') ||
          activity.type.includes('0x1::coin::withdraw') ||
          activity.type.includes('0x1::fungible_asset::withdraw')
        ) {
          // If there was a withdrawal/transfer/send after target date, add it back to get past state
          balanceMap.set(activity.asset_type, currentBalance + activityAmount);
        }
      });

    // Calculate portfolio value at target date
    let totalValue = 0;
    const assets: any[] = [];

    for (const [assetType, balance] of balanceMap.entries()) {
      if (balance <= 0) continue; // Skip assets with zero/negative balance

      const asset = currentAssets.find(a => a.asset_type === assetType);
      const priceInfo = priceData.find(p => p.assetType === assetType);
      const price = priceInfo?.price || 0;
      const decimals = asset?.metadata?.decimals || 8;
      const balanceFormatted = Number(balance) / Math.pow(10, decimals);
      const value = balanceFormatted * price;

      totalValue += value;
      assets.push({
        assetType,
        symbol: asset?.metadata?.symbol || priceInfo?.symbol || 'Unknown',
        balance: balanceFormatted,
        price,
        value,
      });
    }

    return { totalValue, assets };
  } catch (error) {
    logger.error('Error reconstructing portfolio at date:', error);
    return { totalValue: 0, assets: [] };
  }
}

export async function getAssetPrices(
  assetTypes: string[]
): Promise<AssetPrice[]> {
  const prices: AssetPrice[] = [];

  try {
    logger.info(
      `Fetching prices for ${assetTypes.length} official assets via optimized batch call`
    );

    // OPTIMIZATION: Make single API call to get all Panora prices instead of individual calls
    const allPanoraPrices = await PanoraService.getAllPrices();
    logger.info(`Received ${allPanoraPrices.length} prices from Panora API`);

    // Create a set of official token addresses for validation
    const officialTokenAddresses = new Set(
      allPanoraPrices
        .map(token => token.faAddress || token.tokenAddress)
        .filter(Boolean)
    );

    // Debug: Log first few Panora addresses to see format
    if (allPanoraPrices.length > 0) {
      logger.info(
        `Sample Panora addresses: ${allPanoraPrices
          .slice(0, 3)
          .map(p => `${p.symbol}: fa=${p.faAddress}, token=${p.tokenAddress}`)
          .join('; ')}`
      );
    }

    // Build a map of all valid Panora addresses for fast lookup
    const panoraAddressMap = new Map<string, PanoraPriceResponse>();
    for (const token of allPanoraPrices) {
      // Map both faAddress and tokenAddress to the token data
      if (token.faAddress) {
        panoraAddressMap.set(token.faAddress, token);
      }
      if (token.tokenAddress) {
        panoraAddressMap.set(token.tokenAddress, token);
      }

      // Special case for APT - add common variations
      if (token.symbol === 'APT') {
        panoraAddressMap.set('0x1::aptos_coin::AptosCoin', token);
      }
      // Special case for USDC - add common variations
      if (token.symbol === 'USDC') {
        panoraAddressMap.set(
          '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
          token
        );
        panoraAddressMap.set(
          '0x397071c01929cc6672a17f130bd62b1bce224309029837ce4f18214cc83ce2a7::USDC::USDC',
          token
        );
      }
      // Special case for USDT - add common variations
      if (token.symbol === 'USDT') {
        panoraAddressMap.set(
          '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
          token
        );
      }
    }

    // Match each asset type with Panora data
    for (const assetType of assetTypes) {
      // Special handling for MKLP (Merkle LP tokens) - hardcoded to $1.05
      if (
        assetType.includes(
          '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06'
        )
      ) {
        prices.push({
          assetType,
          symbol: 'MKLP',
          price: 1.05,
          change24h: 0,
          marketCap: 0,
        });
        logger.info('Using hardcoded price for MKLP: $1.05');
        continue;
      }

      const panoraMatch = panoraAddressMap.get(assetType);

      if (panoraMatch) {
        prices.push({
          assetType,
          symbol: panoraMatch.symbol,
          price: parseFloat(panoraMatch.usdPrice),
          change24h: 0, // Panora doesn't provide 24h change
          marketCap: 0,
        });
        logger.info(
          `Found Panora price for ${panoraMatch.symbol}: $${panoraMatch.usdPrice}`
        );
      } else {
        // Debug: Log what we're trying to match
        logger.debug(`No Panora match for asset: ${assetType}`);

        // Fallback for assets not found in Panora
        const symbol = PanoraService.getSymbolForAssetType(assetType);
        logger.info(
          `Asset ${assetType} not found in Panora, trying CMC fallback for ${symbol}`
        );

        // Try CMC for known symbols
        if (
          symbol &&
          ['APT', 'USDC', 'USDT', 'WETH', 'WBTC', 'BTC', 'ETH'].includes(
            symbol.toUpperCase()
          )
        ) {
          try {
            const { PriceService } = await import(
              '@/lib/trpc/domains/market-data/prices/services' // TODO: Move PriceService to /lib/services/
            );
            const cmcData = await PriceService.getCMCPrice(
              symbol.toUpperCase()
            );
            prices.push({
              assetType,
              symbol: symbol,
              price: cmcData.price,
              change24h: 0, // CMC data doesn't include change24h in this interface
              marketCap: 0,
            });
            logger.info(`Found CMC price for ${symbol}: $${cmcData.price}`);
          } catch (cmcError) {
            logger.error(`CMC fallback failed for ${symbol}:`, cmcError);
            throw new Error(`Failed to fetch price for ${symbol}`);
          }
        } else {
          // For unknown tokens, skip them instead of failing the entire request
          logger.warn(
            `Skipping unknown token ${assetType} (symbol: ${symbol || 'UNKNOWN'}) - no price source available`
          );
          prices.push({
            assetType,
            symbol: symbol || 'UNKNOWN',
            price: 0,
            change24h: 0,
            marketCap: 0,
          });
        }
      }
    }

    logger.info(`Successfully processed prices for ${prices.length} assets`);
    return prices;
  } catch (error) {
    logger.error('Failed to fetch asset prices:', error);
    throw error;
  }
}

export async function getWalletNFTs(
  walletAddress: string,
  limit: number,
  offset: number
): Promise<NFT[]> {
  // Temporarily disable caching to fix configuration issues

  try {
    logger.info(`Fetching NFTs for ${walletAddress} from Aptos indexer`);

    const response = await graphQLRequest<{
      current_token_ownerships_v2: Array<{
        current_token_data: {
          token_data_id: string;
          token_name: string;
          description?: string;
          token_uri: string;
          cdn_asset_uris?: {
            cdn_image_uri?: string;
            cdn_animation_uri?: string;
          };
          current_collection?: {
            collection_name: string;
            description?: string;
            creator_address: string;
            uri?: string;
          };
        };
        property_version_v1: number;
        amount: number;
        last_transaction_version?: number;
        last_transaction_timestamp?: string;
      }>;
    }>(
      INDEXER,
      {
        query: WALLET_NFTS_QUERY,
        variables: { ownerAddress: walletAddress, limit, offset },
      },
      APTOS_API_KEY
        ? {
            headers: {
              Authorization: `Bearer ${APTOS_API_KEY}`,
            },
          }
        : {}
    );

    const nfts = response.current_token_ownerships_v2.map(ownership => ({
      token_data_id: ownership.current_token_data.token_data_id,
      token_name: ownership.current_token_data.token_name,
      collection_name:
        ownership.current_token_data.current_collection?.collection_name ||
        'Unknown Collection',
      token_uri: ownership.current_token_data.token_uri,
      description: ownership.current_token_data.description,
      property_version_v1: ownership.property_version_v1,
      amount: ownership.amount,
      cdn_image_uri: ownership.current_token_data.cdn_asset_uris?.cdn_image_uri,
      cdn_animation_uri:
        ownership.current_token_data.cdn_asset_uris?.cdn_animation_uri,
      collection_description:
        ownership.current_token_data.current_collection?.description,
      creator_address:
        ownership.current_token_data.current_collection?.creator_address,
      collection_uri: ownership.current_token_data.current_collection?.uri,
      last_transaction_version: ownership.last_transaction_version,
      last_transaction_timestamp: ownership.last_transaction_timestamp,
    }));

    logger.info(`Found ${nfts.length} NFTs for wallet ${walletAddress}`);

    return nfts;
  } catch (error) {
    logger.error('Failed to fetch wallet NFTs:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      walletAddress,
      limit,
      offset,
    });

    // Throw the original error with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch wallet NFTs: ${String(error)}`);
  }
}

export async function getNFTTransferHistory(
  tokenDataId: string,
  limit: number = 20
): Promise<
  Array<{
    transaction_version: string;
    transaction_timestamp: string;
    from_address: string;
    to_address: string;
    token_amount: string;
    property_version_v1: number;
    transfer_type: string;
    is_transaction_success: boolean;
  }>
> {
  try {
    logger.info(`Fetching transfer history for NFT: ${tokenDataId}`);

    const response = await graphQLRequest<{
      token_activities_v2: Array<{
        transaction_version: string;
        transaction_timestamp: string;
        from_address: string;
        to_address: string;
        token_amount: string;
        property_version_v1: number;
        transfer_type: string;
        is_transaction_success: boolean;
      }>;
    }>(
      INDEXER,
      {
        query: `
        query GetNFTTransferHistory($tokenDataId: String!, $limit: Int!) {
          token_activities_v2(
            where: {
              token_data_id: { _eq: $tokenDataId }
              is_transaction_success: { _eq: true }
            }
            order_by: { transaction_timestamp: desc }
            limit: $limit
          ) {
            transaction_version
            transaction_timestamp
            from_address
            to_address
            token_amount
            property_version_v1
            transfer_type
            is_transaction_success
          }
        }
      `,
        variables: { tokenDataId, limit },
      },
      APTOS_API_KEY
        ? {
            headers: {
              Authorization: `Bearer ${APTOS_API_KEY}`,
            },
          }
        : {}
    );

    const transfers = response.token_activities_v2 || [];
    logger.info(
      `Found ${transfers.length} transfer records for NFT ${tokenDataId}`
    );

    return transfers;
  } catch (error) {
    logger.error('Failed to fetch NFT transfer history:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tokenDataId,
      limit,
    });

    throw new Error(`Failed to fetch NFT transfer history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function calculatePortfolioMetrics(
  walletAddress: string,
  showOnlyVerified: boolean = true
): Promise<PortfolioMetrics> {
  // Temporarily disable caching to fix configuration issues
  try {
    // getWalletAssets respects the showOnlyVerified parameter
    const assets = await getWalletAssets(walletAddress, showOnlyVerified);
    const prices = await getAssetPrices(assets.map(a => a.asset_type));

    let totalValue = 0;
    let totalChange24h = 0;
    const assetValues: Array<{
      assetType: string;
      symbol: string;
      value: number;
      change24h: number;
    }> = [];

    for (const asset of assets) {
      const priceInfo = prices.find(p => p.assetType === asset.asset_type);
      const price = priceInfo?.price || 0;

      // Include all assets in metrics calculations

      // Include assets even without price data, just skip NaN prices
      if (isNaN(price)) {
        logger.info(
          `Skipping NaN price for ${asset.metadata?.symbol || 'Unknown'} in metrics calculation`
        );
        continue;
      }

      const decimals = asset.metadata?.decimals || 8;
      const balance = Number(asset.amount) / Math.pow(10, decimals);
      const value = balance * price;
      const change24h = priceInfo?.change24h || 0;
      const valueChange = value * (change24h / 100);

      totalValue += value;
      totalChange24h += valueChange;

      assetValues.push({
        assetType: asset.asset_type,
        symbol: asset.metadata?.symbol || priceInfo?.symbol || 'Unknown',
        value,
        change24h,
      });
    }

    const totalChangePercent24h =
      totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

    // Calculate allocation percentages
    const assetAllocation = assetValues.map(av => ({
      assetType: av.assetType,
      symbol: av.symbol,
      value: av.value,
      percentage: totalValue > 0 ? (av.value / totalValue) * 100 : 0,
    }));

    // Sort by change24h to get top gainers and losers
    const sortedByChange = [...prices].sort(
      (a, b) => b.change24h - a.change24h
    );
    const topGainers = sortedByChange.filter(p => p.change24h > 0).slice(0, 3);
    const topLosers = sortedByChange
      .filter(p => p.change24h < 0)
      .slice(-3)
      .reverse();

    return {
      totalValue,
      totalChange24h,
      totalChangePercent24h,
      assetAllocation,
      topGainers,
      topLosers,
    };
  } catch (error) {
    logger.error('Failed to calculate portfolio metrics:', error);
    return {
      totalValue: 0,
      totalChange24h: 0,
      totalChangePercent24h: 0,
      assetAllocation: [],
      topGainers: [],
      topLosers: [],
    };
  }
}

export async function getWalletTransactions(
  walletAddress: string,
  limit: number = 20
): Promise<WalletTransaction[]> {
  try {
    logger.info(`Fetching ${limit} recent transactions for ${walletAddress}`);

    const response = await graphQLRequest<{
      fungible_asset_activities: WalletTransaction[];
    }>(
      INDEXER,
      {
        query: WALLET_TRANSACTIONS_QUERY,
        variables: {
          ownerAddress: walletAddress,
          limit: limit,
        },
      },
      APTOS_API_KEY
        ? {
            headers: {
              Authorization: `Bearer ${APTOS_API_KEY}`,
            },
          }
        : {}
    );

    const transactions = response.fungible_asset_activities || [];
    logger.info(
      `Found ${transactions.length} transactions for wallet ${walletAddress}`
    );

    return transactions;
  } catch (error: any) {
    logger.error('Failed to fetch wallet transactions:', error);

    // Handle rate limiting gracefully
    if (error.status === 429) {
      logger.warn(
        'API rate limit reached for transactions'
      );
      throw new Error('API rate limit reached - please try again later');
    }

    throw new Error('Failed to fetch wallet transactions');
  }
}