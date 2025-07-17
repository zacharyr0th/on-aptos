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

// GraphQL response types
interface FASupplyResponse {
  fungible_asset_metadata?: Array<{
    asset_type: string;
    supply_v2: string;
    decimals: number;
    name: string;
    symbol: string;
  }>;
}

interface CoinSupplyResponse {
  coin_infos?: Array<{
    coin_type: string;
    decimals: number;
    name: string;
    symbol: string;
  }>;
}

/** Aptos Labs public Indexer endpoint */
const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

// Use centralized cache
const config = SERVICE_CONFIG.lst;

// Different queries for coin vs FA tokens
const FA_SUPPLY_QUERY = `
  query GetFASupply($type: String!) {
    fungible_asset_metadata(
      where: { asset_type: { _eq: $type } }
    ) {
      asset_type
      supply_v2
      decimals
      name
      symbol
    }
  }
`;

const COIN_SUPPLY_QUERY = `
  query GetCoinSupply($coin_type: String!) {
    coin_infos(
      where: { coin_type: { _eq: $coin_type } }
    ) {
      coin_type
      decimals
      name
      symbol
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

  // Use environment variable pattern from stablecoin implementation
  if (process.env.APTOS_BUILD_SECRET) {
    headers['Authorization'] = `Bearer ${process.env.APTOS_BUILD_SECRET}`;
  }

  const hasAuth = !!headers['Authorization'];

  console.log('[LST] Executing GraphQL query', {
    endpoint: INDEXER_URL,
    hasAuth,
    authType: headers['Authorization'] ? 'Bearer' : 'None',
    headers: Object.keys(headers),
    variables: JSON.stringify(variables),
    timestamp: new Date().toISOString(),
  });

  // Warn if no auth configured
  if (!hasAuth) {
    console.warn(
      '[LST] WARNING: No Aptos authentication configured. API may hit rate limits.'
    );
  }

  const fetchOptions: FetchOptions = {
    timeout: Math.min(config.timeout, 15000), // Increase timeout for LST queries
    retries: 2, // Increase retries for coin queries
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
 * Combine Coin and FA versions of amAPT and stAPT
 */
function combineTokenSupplies(rawSupplies: LSTSupply[]): LSTSupply[] {
  const combined: Record<string, LSTSupply> = {};

  for (const supply of rawSupplies) {
    let baseSymbol = supply.symbol;

    // Handle FA versions - remove -FA suffix and combine with base token
    if (supply.symbol.endsWith('-FA')) {
      baseSymbol = supply.symbol.replace('-FA', '');
    }

    if (combined[baseSymbol]) {
      // Combine supplies
      const existingSupply = BigInt(combined[baseSymbol].supply);
      const newSupply = BigInt(supply.supply);
      const totalSupply = existingSupply + newSupply;

      combined[baseSymbol] = {
        ...combined[baseSymbol],
        supply: totalSupply.toString(),
        formatted_supply: formatTokenAmount(
          totalSupply,
          combined[baseSymbol].decimals
        ),
      };

      console.log('[LST] Combined token supplies', {
        baseSymbol,
        existingSupply: existingSupply.toString(),
        newSupply: newSupply.toString(),
        totalSupply: totalSupply.toString(),
        formattedTotal: formatTokenAmount(
          totalSupply,
          combined[baseSymbol].decimals
        ),
      });
    } else {
      // First occurrence of this token
      combined[baseSymbol] = {
        symbol: baseSymbol,
        name: supply.name.replace(' (FA)', ''), // Remove FA suffix from name
        supply: supply.supply,
        formatted_supply: supply.formatted_supply,
        decimals: supply.decimals,
        asset_type: supply.asset_type, // Keep the original asset_type for reference
      };
    }
  }

  return Object.values(combined);
}

/**
 * Core data fetching logic for LST supplies
 */
export async function fetchLSTSuppliesData(): Promise<LSTSupplyData> {
  let rateLimitError: Error | null = null;
  let successfulFetches = 0;

  console.log('[LST] Starting LST supplies fetch', {
    tokenCount: TOKENS.length,
    tokens: TOKENS.map(t => ({ symbol: t.symbol, assetType: t.asset_type })),
    timestamp: new Date().toISOString(),
    indexerUrl: INDEXER_URL,
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

      // Kofi and TruFin tokens are FA only, others are mixed
      // Check if it's a coin token (has ::) but exclude FA-only tokens
      const isFAOnlyToken =
        token.symbol.includes('kAPT') ||
        token.symbol.includes('stkAPT') ||
        token.symbol.includes('truAPT');
      const isCoinToken = token.asset_type.includes('::') && !isFAOnlyToken;
      const query = isCoinToken ? COIN_SUPPLY_QUERY : FA_SUPPLY_QUERY;
      const queryType = isCoinToken ? 'coin_type' : 'type';

      console.log('[LST] Token type determined', {
        symbol: token.symbol,
        isFAOnlyToken,
        isCoinToken,
        assetType: token.asset_type,
        queryType,
        tableUsed: isCoinToken
          ? 'current_coin_balances'
          : 'current_fungible_asset_balances',
      });

      let rawResult;
      try {
        rawResult = await executeGraphQLQuery(query, {
          [queryType]: token.asset_type,
        });
      } catch (error) {
        // If coin query fails, try as FA query
        if (isCoinToken) {
          console.warn(
            `[LST] Coin query failed for ${token.symbol}, trying as FA:`,
            error
          );
          try {
            rawResult = await executeGraphQLQuery(FA_SUPPLY_QUERY, {
              type: token.asset_type,
            });
          } catch (faError) {
            console.error(
              `[LST] Both coin and FA queries failed for ${token.symbol}`
            );
            throw error; // Throw original error
          }
        } else {
          throw error;
        }
      }

      // Log the raw result to debug
      console.log('[LST] Raw GraphQL response for', token.symbol, {
        hasData: !!rawResult,
        keys: rawResult ? Object.keys(rawResult) : [],
        sample: JSON.stringify(rawResult).substring(0, 200),
      });

      // Extract supply from metadata
      let totalAmount = 0n;

      if (isCoinToken) {
        const coinResult = rawResult as CoinSupplyResponse;
        const coinInfo = coinResult?.coin_infos?.[0];

        if (coinInfo) {
          console.log('[LST] Coin info found', {
            symbol: token.symbol,
            coinType: coinInfo.coin_type,
            name: coinInfo.name,
            symbolFromQuery: coinInfo.symbol,
          });

          // Fetch coin supply using view function approach
          try {
            const viewUrl = `https://api.mainnet.aptoslabs.com/v1/view`;
            const viewPayload = {
              function: '0x1::coin::supply',
              type_arguments: [coinInfo.coin_type],
              arguments: [],
            };

            const headers: Record<string, string> = {
              'content-type': 'application/json',
              'User-Agent': 'Next.js/14 DeFi-Dashboard (LST-Supplies)',
            };

            if (process.env.APTOS_BUILD_SECRET) {
              headers['Authorization'] =
                `Bearer ${process.env.APTOS_BUILD_SECRET}`;
            }

            console.log('[LST] Fetching coin supply via view function', {
              symbol: token.symbol,
              coinType: coinInfo.coin_type,
              viewUrl,
            });

            const response = await fetch(viewUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(viewPayload),
            });

            if (!response.ok) {
              throw new Error(
                `View function failed: ${response.status} ${response.statusText}`
              );
            }

            const supplyData = await response.json();
            console.log('[LST] View function response', {
              symbol: token.symbol,
              supplyData: JSON.stringify(supplyData),
            });

            // Extract supply value - view function returns [supply_value] or null
            if (
              supplyData &&
              Array.isArray(supplyData) &&
              supplyData.length > 0
            ) {
              const supplyOption = supplyData[0];
              if (
                supplyOption &&
                supplyOption.vec &&
                supplyOption.vec.length > 0
              ) {
                totalAmount = BigInt(supplyOption.vec[0]);
                console.log(
                  '[LST] Coin supply fetched successfully via view function',
                  {
                    symbol: token.symbol,
                    supply: totalAmount.toString(),
                    formattedSupply: formatTokenAmount(
                      totalAmount,
                      token.decimals
                    ),
                  }
                );
              } else {
                console.warn(
                  '[LST] Supply option is empty (coin may not exist)',
                  {
                    symbol: token.symbol,
                    supplyOption,
                  }
                );
              }
            } else {
              console.warn('[LST] Invalid view function response structure', {
                symbol: token.symbol,
                supplyData,
              });
            }
          } catch (restError) {
            console.error(
              '[LST] Failed to fetch coin supply via view function',
              {
                symbol: token.symbol,
                error: (restError as Error).message,
              }
            );
          }
        } else {
          console.warn('[LST] No coin info found', {
            symbol: token.symbol,
            result: JSON.stringify(rawResult).substring(0, 200),
          });
        }
      } else {
        const faResult = rawResult as FASupplyResponse;
        const faMetadata = faResult?.fungible_asset_metadata?.[0];

        if (faMetadata && faMetadata.supply_v2) {
          totalAmount = BigInt(faMetadata.supply_v2);

          console.log('[LST] FA metadata found', {
            symbol: token.symbol,
            assetType: faMetadata.asset_type,
            name: faMetadata.name,
            symbolFromQuery: faMetadata.symbol,
            supply: totalAmount.toString(),
            decimals: faMetadata.decimals,
          });
        } else {
          console.warn('[LST] No FA metadata found or no supply', {
            symbol: token.symbol,
            hasMetadata: !!faMetadata,
            hasSupply: faMetadata ? !!faMetadata.supply_v2 : false,
            result: JSON.stringify(rawResult).substring(0, 200),
          });
        }
      }

      // Check if we got an error response
      if (rawResult && typeof rawResult === 'object' && 'errors' in rawResult) {
        console.error('[LST] GraphQL errors received', {
          symbol: token.symbol,
          errors: (rawResult as any).errors,
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
      console.error(`[LST] Failed to resolve token ${token.symbol}:`, {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Check if this is a rate limit error
      if (
        error.message?.includes('429') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('Too Many Requests')
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
  const rawSupplies = await batchRequests(requestFunctions, batchOptions);

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

  // Combine amAPT and stAPT (Coin + FA versions)
  const supplies = combineTokenSupplies(rawSupplies);

  const totalRaw = supplies.reduce((sum, t) => sum + BigInt(t.supply), 0n);
  const totalFormatted = formatTokenAmount(totalRaw, 8);

  console.log('[LST] LST supplies processing complete', {
    successfulSupplies: supplies.filter(s => s.supply !== '0').length,
    totalSupplies: supplies.length,
    totalLST: totalFormatted,
    supplies: supplies.map(s => ({
      symbol: s.symbol,
      formatted: s.formatted_supply,
      supply: s.supply,
    })),
  });

  // Debug summary
  console.log('[LST] === FINAL DEBUG SUMMARY ===');
  console.log(
    `[LST] ✅ Successfully fetched ${successfulFetches}/${TOKENS.length} tokens`
  );
  console.log(`[LST] 💰 Total LST Value: ${totalFormatted}`);
  console.log('[LST] 🔢 Non-zero supplies:');
  supplies.forEach(s => {
    if (s.supply !== '0') {
      console.log(`[LST]   - ${s.symbol}: ${s.formatted_supply} (${s.supply})`);
    } else {
      console.log(`[LST]   - ${s.symbol}: ❌ ZERO SUPPLY`);
    }
  });
  console.log('[LST] === END DEBUG SUMMARY ===');

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
