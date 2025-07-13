import { LST_TOKENS as TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { getEnvVar } from '@/lib/config/validate-env';
import {
  graphQLRequest,
  formatBigIntWithDecimals,
  batchRequests,
  type FetchOptions,
  type BatchRequestOptions,
} from '@/lib/utils';

// Define types locally since we removed schemas
export interface LSTSupply {
  symbol: string;
  name: string;
  supply: string;
  formatted_supply: string;
  decimals: number;
  asset_type: string;
}

export interface LSTSupplyData {
  supplies: LSTSupply[];
  total: string;
  total_formatted: string;
  debug?: any;
}

// GraphQL response type
interface TokenBalancesResponse {
  current_fungible_asset_balances?: Array<{
    amount: string;
    owner_address: string;
  }>;
}

/** Aptos Labs public Indexer endpoint */
const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

// Use centralized cache
const config = SERVICE_CONFIG.lst;

// GraphQL query for fetching token balances
const DIRECT_QUERY = `
  query TokenBalances($type: String!) {
    current_fungible_asset_balances(
      where: { asset_type: { _eq: $type } }
      limit: 1000
    ) {
      amount
      owner_address
    }
  }
`;

/**
 * Execute a GraphQL query against the Aptos Indexer
 */
async function executeGraphQLQuery(
  query: string,
  variables: Record<string, unknown>
) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'User-Agent': 'Next.js/14 DeFi-Dashboard (LST-Supplies)',
  };

  // Add Aptos API key if available
  const aptosKey = getEnvVar('APTOS_BUILD_KEY');
  const aptosSecret = getEnvVar('APTOS_BUILD_SECRET');

  if (aptosKey) {
    headers['Authorization'] = `Bearer ${aptosKey}`;
  } else if (aptosSecret) {
    headers['x-api-key'] = aptosSecret;
  }

  console.log('[LST] Executing GraphQL query', {
    endpoint: INDEXER_URL,
    hasAuth: !!(aptosKey || aptosSecret),
    variables: JSON.stringify(variables),
    timestamp: new Date().toISOString(),
  });

  const fetchOptions: FetchOptions = {
    timeout: Math.min(config.timeout, 8000), // Cap at 8 seconds for production
    retries: 1, // Reduced retries for faster failure
    headers,
  };

  return await graphQLRequest(INDEXER_URL, { query, variables }, fetchOptions);
}

/**
 * Format token amounts with proper decimal places
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return '0';
  return formatBigIntWithDecimals(amount, decimals);
}

/**
 * Core data fetching logic for LST supplies
 */
export async function fetchLSTSuppliesData(): Promise<LSTSupplyData> {
  let rateLimitError: Error | null = null;
  let successfulFetches = 0;

  console.log('[LST] Starting LST supplies fetch', {
    tokenCount: TOKENS.length,
    tokens: TOKENS.map(t => t.symbol),
    timestamp: new Date().toISOString(),
  });

  // Create batch requests with delay to avoid rate limiting
  const batchOptions: BatchRequestOptions = {
    concurrency: 3, // Slightly more aggressive for production
    delayBetween: 50, // Shorter delay for faster execution
  };

  // Create request functions for batch processing
  const requestFunctions = TOKENS.map(token => async () => {
    try {
      console.log('[LST] Fetching token supply', {
        symbol: token.symbol,
        assetType: token.asset_type,
      });

      const result = (await executeGraphQLQuery(DIRECT_QUERY, {
        type: token.asset_type,
      })) as TokenBalancesResponse;

      // Sum up all balances manually
      let totalAmount = 0n;
      if (result?.current_fungible_asset_balances) {
        console.log('[LST] Processing balances', {
          symbol: token.symbol,
          balanceCount: result.current_fungible_asset_balances.length,
        });

        for (const balance of result.current_fungible_asset_balances) {
          if (balance.amount) {
            totalAmount += BigInt(balance.amount);
          }
        }
      } else {
        console.warn('[LST] No balances found', {
          symbol: token.symbol,
          result: JSON.stringify(result).substring(0, 200),
        });
      }

      successfulFetches++;

      console.log('[LST] Token supply fetched successfully', {
        symbol: token.symbol,
        supply: totalAmount.toString(),
        formattedSupply: formatTokenAmount(totalAmount, token.decimals),
      });

      return {
        symbol: token.symbol,
        name: token.name,
        supply: totalAmount.toString(),
        formatted_supply: formatTokenAmount(totalAmount, token.decimals),
        decimals: token.decimals,
        asset_type: token.asset_type,
      };
    } catch (e) {
      const error = e as Error;
      console.error(`[LST] Failed to resolve token ${token.symbol}:`, error);

      // Check if this is a rate limit error
      if (
        error.message?.includes('429') ||
        error.message?.includes('rate limit')
      ) {
        rateLimitError = error;
        console.error('[LST] Rate limit error detected', {
          symbol: token.symbol,
          errorMessage: error.message,
        });
      }

      return {
        symbol: token.symbol,
        name: token.name,
        supply: '0',
        formatted_supply: '0',
        decimals: token.decimals,
        asset_type: token.asset_type,
      };
    }
  });

  // Execute requests with rate limiting
  const supplies = await batchRequests(requestFunctions, batchOptions);

  console.log('[LST] Batch requests completed', {
    totalRequests: requestFunctions.length,
    successfulFetches,
    failedFetches: requestFunctions.length - successfulFetches,
  });

  // If we hit rate limits and got no successful fetches, throw the error
  if (rateLimitError && successfulFetches === 0) {
    console.error('[LST] All requests failed due to rate limiting');
    throw rateLimitError;
  }

  const totalRaw = supplies.reduce((sum, t) => sum + BigInt(t.supply), 0n);
  const totalFormatted = formatTokenAmount(totalRaw, 8);

  console.log('[LST] LST supplies processing complete', {
    successfulSupplies: supplies.filter(s => s.supply !== '0').length,
    totalSupplies: supplies.length,
    totalLST: totalFormatted,
    supplies: supplies.map(s => ({
      symbol: s.symbol,
      formatted: s.formatted_supply,
    })),
  });

  return {
    supplies,
    total: totalRaw.toString(),
    total_formatted: totalFormatted,
    debug: {
      source: 'Aptos Indexer',
      tokenCount: TOKENS.length,
      indexerUrl: INDEXER_URL,
      query: 'direct_balances',
      successfulFetches,
      hadRateLimitError: !!rateLimitError,
    },
  };
}