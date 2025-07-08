import {
  STABLE_TOKENS as TOKENS,
  TETHER_RESERVE_ADDRESS,
} from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  cmcCache,
  getCachedData,
  setCachedData,
  graphQLRequest,
  withErrorHandling,
  ApiError,
  type FetchOptions,
  type ErrorContext,
} from '@/lib/utils';
import type { StablesGraphQLResponse, BalanceGraphQLResponse } from './schemas';

/**
 * Stablecoins Domain Services
 */

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const config = SERVICE_CONFIG.stables;

// GraphQL queries
const SUPPLIES_QUERY = `
  query Supply($types: [String!]) {
    fungible_asset_metadata(where: {asset_type: {_in: $types}}) {
      asset_type
      supply_v2
    }
  }
`;

const BALANCE_QUERY = `
  query AccountBalance($assetType: String!, $ownerAddress: String!) {
    current_fungible_asset_balances(
      where: { 
        asset_type: { _eq: $assetType }, 
        owner_address: { _eq: $ownerAddress } 
      }
      limit: 1
    ) {
      amount
      owner_address
    }
  }
`;

/**
 * Fetch all stablecoin supplies from GraphQL
 */
export async function fetchAllSuppliesData(): Promise<Record<string, bigint>> {
  const tokenTypes = Object.values(TOKENS);

  const fetchOptions: FetchOptions = {
    timeout: config.timeout,
    retries: config.retries,
    headers: {
      'User-Agent': 'Next.js/14 StableCoin-Dashboard v1.0',
    },
  };

  const result = await graphQLRequest(
    INDEXER,
    {
      query: SUPPLIES_QUERY,
      variables: { types: tokenTypes },
    },
    fetchOptions
  );

  console.log('GraphQL response:', JSON.stringify(result, null, 2));

  // Handle case where result might be undefined or malformed
  let validatedData: {
    data: StablesGraphQLResponse;
    errors?: Array<{ message: string }>;
  };

  // The graphQLRequest utility already extracts result.data, so we expect the data directly
  if (
    result &&
    typeof result === 'object' &&
    'fungible_asset_metadata' in result
  ) {
    validatedData = {
      data: result as StablesGraphQLResponse,
      errors: undefined,
    };
  } else {
    throw new ApiError(
      `Invalid GraphQL response structure: expected fungible_asset_metadata but got ${JSON.stringify(result)}`,
      undefined,
      'Stables-GraphQL'
    );
  }

  if (validatedData.errors && validatedData.errors.length > 0) {
    throw new ApiError(
      `GraphQL errors: ${validatedData.errors.map((e: { message: string }) => e.message).join(', ')}`,
      undefined,
      'Stables-GraphQL'
    );
  }

  const supplies: Record<string, bigint> = {};

  // Process results
  for (const item of validatedData.data.fungible_asset_metadata) {
    const supplyValue = BigInt(
      typeof item.supply_v2 === 'string'
        ? item.supply_v2
        : String(item.supply_v2)
    );
    supplies[item.asset_type] = supplyValue;
  }

  // Check for missing tokens and try individual cache lookups
  for (const tokenType of tokenTypes) {
    if (!(tokenType in supplies)) {
      const cachedValue = getCachedData<string>(
        cmcCache,
        `stables:${tokenType}`
      );
      if (cachedValue) {
        supplies[tokenType] = BigInt(cachedValue);
      } else {
        supplies[tokenType] = BigInt(0);
      }
    }
  }

  // Also cache individual token supplies for fallback purposes
  for (const [tokenType, supply] of Object.entries(supplies)) {
    setCachedData(cmcCache, `stables:${tokenType}`, supply.toString());
  }

  return supplies;
}

/**
 * Get cached fallback values for stablecoins
 */
export function fallbackToCachedValues(
  tokenTypes: string[]
): Record<string, bigint> {
  const fallbackSupplies: Record<string, bigint> = {};

  for (const tokenType of tokenTypes) {
    const cachedValue = getCachedData<string>(cmcCache, `stables:${tokenType}`);
    if (cachedValue) {
      fallbackSupplies[tokenType] = BigInt(cachedValue);
    }
  }

  return fallbackSupplies;
}

/**
 * Fetch Tether reserve balance
 */
export async function fetchTetherReserveBalanceData(): Promise<bigint> {
  const fetchOptions: FetchOptions = {
    timeout: config.timeout,
    retries: config.retries,
    headers: {
      'User-Agent': 'Next.js/14 StableCoin-Dashboard v1.0',
    },
  };

  const result = (await graphQLRequest(
    INDEXER,
    {
      query: BALANCE_QUERY,
      variables: {
        assetType: TOKENS.USDt,
        ownerAddress: TETHER_RESERVE_ADDRESS,
      },
    },
    fetchOptions
  )) as BalanceGraphQLResponse;

  // Extract balance from response
  const balances = result?.current_fungible_asset_balances || [];
  const balance =
    balances.length > 0 ? BigInt(balances[0].amount || '0') : BigInt(0);

  console.log(`Tether reserve balance: ${balance.toString()}`);
  return balance;
}

/**
 * Process and format stablecoin supplies data
 */
export async function processStablesSuppliesData() {
  const errorContext: ErrorContext = {
    operation: 'All supplies fetch',
    service: 'Stables-AllSupplies',
  };

  const reserveErrorContext: ErrorContext = {
    operation: 'Tether reserve balance fetch',
    service: 'Stables-TetherReserve',
  };

  // Get all supplies and Tether reserve balance in parallel
  const [supplies, tetherReserveBalance] = await Promise.all([
    withErrorHandling(async () => {
      try {
        return await fetchAllSuppliesData();
      } catch (error) {
        console.error('Error fetching supplies:', error);
        // Try to fallback to cached values
        const tokenTypes = Object.values(TOKENS);
        const fallbackSupplies = fallbackToCachedValues(tokenTypes);
        if (Object.keys(fallbackSupplies).length > 0) {
          console.log('Using fallback cached values');
          return fallbackSupplies;
        }
        throw error;
      }
    }, errorContext),
    withErrorHandling(async () => {
      try {
        return await fetchTetherReserveBalanceData();
      } catch (error) {
        console.error('Error fetching Tether reserve balance:', error);
        // Return 0 on error to avoid breaking the main supply calculation
        return BigInt(0);
      }
    }, reserveErrorContext),
  ]);

  // Convert to the expected format with symbol mapping
  const suppliesData = [];
  let totalSupply = BigInt(0);
  let hasFallback = false;

  for (const [symbol, assetType] of Object.entries(TOKENS)) {
    let supply = supplies[assetType] || BigInt(0);

    // Subtract Tether reserve balance from USDt supply
    if (symbol === 'USDt' && tetherReserveBalance > 0) {
      supply = supply - tetherReserveBalance;
      console.log(
        `USDt supply after reserve subtraction: ${supply.toString()} (reserve: ${tetherReserveBalance.toString()})`
      );
    }

    // Ensure supply is BigInt before arithmetic operations
    const supplyBigInt = typeof supply === 'bigint' ? supply : BigInt(supply);
    totalSupply += supplyBigInt;

    // Check if this came from cache (indicating potential fallback)
    const cached = getCachedData<string>(cmcCache, `stables:${assetType}`);
    if (cached) {
      hasFallback = true;
    }

    suppliesData.push({
      symbol,
      supply: (supplyBigInt / BigInt(1000000)).toString(), // Convert to proper decimals (6 for stablecoins)
      supply_raw: supplyBigInt.toString(),
      percentage: 0, // Will be calculated below
      asset_type: assetType,
    });
  }

  // Calculate percentages
  for (const item of suppliesData) {
    const rawSupply = BigInt(item.supply_raw);
    item.percentage =
      totalSupply > 0
        ? Number((rawSupply * BigInt(10000)) / totalSupply) / 100
        : 0;
  }

  // Performance metrics
  const performanceMetrics = {
    cache_hits: 0, // This would need to be tracked properly
    cache_misses: suppliesData.length,
    api_calls: 2, // Now we make 2 calls: supplies + reserve balance
  };

  return {
    supplies: suppliesData,
    total: (totalSupply / BigInt(1000000)).toString(),
    total_raw: totalSupply.toString(),
    debug: {
      cached_entries: 0, // Would need to be tracked from cache
      fallback_used: hasFallback,
      performance: performanceMetrics,
    },
  };
}
