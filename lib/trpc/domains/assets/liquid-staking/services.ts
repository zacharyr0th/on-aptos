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
import type { LSTSupplyResponse } from './schemas';

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

  const fetchOptions: FetchOptions = {
    timeout: config.timeout,
    retries: config.retries,
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
export async function fetchLSTSuppliesData(): Promise<
  LSTSupplyResponse['data']
> {
  let rateLimitError: Error | null = null;
  let successfulFetches = 0;

  // Create batch requests with delay to avoid rate limiting
  const batchOptions: BatchRequestOptions = {
    concurrency: 2, // Process 2 requests at a time
    delayBetween: 100, // 100ms delay between batches
  };

  // Create request functions for batch processing
  const requestFunctions = TOKENS.map(token => async () => {
    try {
      const result = (await executeGraphQLQuery(DIRECT_QUERY, {
        type: token.asset_type,
      })) as TokenBalancesResponse;

      // Sum up all balances manually
      let totalAmount = 0n;
      if (result?.current_fungible_asset_balances) {
        for (const balance of result.current_fungible_asset_balances) {
          if (balance.amount) {
            totalAmount += BigInt(balance.amount);
          }
        }
      }

      successfulFetches++;

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
      console.error(`Failed to resolve token ${token.symbol}:`, error);

      // Check if this is a rate limit error
      if (
        error.message?.includes('429') ||
        error.message?.includes('rate limit')
      ) {
        rateLimitError = error;
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

  // If we hit rate limits and got no successful fetches, throw the error
  if (rateLimitError && successfulFetches === 0) {
    throw rateLimitError;
  }

  const totalRaw = supplies.reduce((sum, t) => sum + BigInt(t.supply), 0n);
  const totalFormatted = formatTokenAmount(totalRaw, 8);

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
