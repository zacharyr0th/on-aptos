/**
 * Protocol-Specific Scanners
 * Specialized scanning functions for different DeFi protocol types
 */

import type { DeFiPosition } from "@/lib/types/defi";
import { graphQLRequest } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";
import { getTokenDecimals, getTokenSymbol, identifyProtocol } from "./utils";

const INDEXER = "https://api.mainnet.aptoslabs.com/v1/graphql";

interface CoinBalance {
  coin_type: string;
  amount: string;
}

interface Transaction {
  transaction_version: string;
  user_transaction?: {
    entry_function_id_str?: string;
  };
}

interface CoinBalanceGraphQLResponse {
  data?: {
    current_coin_balances: CoinBalance[];
  };
}

interface TransactionGraphQLResponse {
  data?: {
    account_transactions: Transaction[];
  };
}

/**
 * Scan liquid staking positions
 */
export async function getLiquidStakingPositions(
  walletAddress: string,
  apiKey: string
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  try {
    const query = `
      query GetLiquidStakingPositions($owner_address: String!) {
        current_coin_balances(
          where: {
            owner_address: {_eq: $owner_address}
            amount: {_gt: 0}
            coin_type: {
              _or: [
                {_ilike: "%stapt%"}
                {_ilike: "%tapt%"}
                {_ilike: "%amapt%"}
                {_ilike: "%dapt%"}
              ]
            }
          }
        ) {
          coin_type
          amount
        }
      }
    `;

    const result = await graphQLRequest(
      INDEXER,
      {
        query,
        variables: {
          owner_address: walletAddress,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const typedResult = result as CoinBalanceGraphQLResponse;
    if (typedResult.data?.current_coin_balances) {
      for (const balance of typedResult.data.current_coin_balances) {
        const coinType = balance.coin_type;
        const amount = parseFloat(balance.amount);
        const decimals = getTokenDecimals(coinType);
        const adjustedAmount = amount / 10 ** decimals;

        if (adjustedAmount > 0.001) {
          // Filter dust
          const protocol = identifyProtocol(coinType);
          const symbol = getTokenSymbol(coinType);

          positions.push({
            id: `lst-${coinType}-${walletAddress}`,
            positionId: `lst-${coinType}-${walletAddress}`,
            protocol: protocol.protocol,
            protocolType: "staking",
            type: "staking",
            address: walletAddress,
            totalValue: 0,
            totalValueUSD: 0,
            assets: [
              {
                type: "supplied",
                tokenAddress: coinType,
                symbol,
                amount: adjustedAmount.toString(),
                valueUSD: 0, // Will be updated with price
              },
            ],
            position: {
              supplied: [
                {
                  asset: coinType,
                  amount: adjustedAmount.toString(),
                  value: 0,
                },
              ],
            },
          });
        }
      }
    }

    logger.info(`Found ${positions.length} liquid staking positions`);
  } catch (error) {
    logger.error("Failed to get liquid staking positions", { error });
  }

  return positions;
}

/**
 * Scan lending positions
 */
export async function getLendingPositions(
  walletAddress: string,
  apiKey: string
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  try {
    const query = `
      query GetLendingPositions($owner_address: String!) {
        account_transactions(
          where: {
            account_address: {_eq: $owner_address}
            type: {_in: ["user_transaction"]}
          }
          order_by: {transaction_version: desc}
          limit: 100
        ) {
          transaction_version
          user_transaction {
            entry_function_id_str
          }
        }
      }
    `;

    const result = await graphQLRequest(
      INDEXER,
      {
        query,
        variables: {
          owner_address: walletAddress,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    // Analyze transactions to identify lending protocols
    const typedResult = result as TransactionGraphQLResponse;
    if (typedResult.data?.account_transactions) {
      const lendingTxs = typedResult.data.account_transactions.filter(
        (tx: Transaction) =>
          tx.user_transaction?.entry_function_id_str?.includes("lending") ||
          tx.user_transaction?.entry_function_id_str?.includes("borrow") ||
          tx.user_transaction?.entry_function_id_str?.includes("supply")
      );

      // For each lending transaction, try to find current positions
      // This would need more sophisticated logic based on specific protocols
      logger.info(`Found ${lendingTxs.length} lending transactions`);
    }

    logger.info(`Found ${positions.length} lending positions`);
  } catch (error) {
    logger.error("Failed to get lending positions", { error });
  }

  return positions;
}

/**
 * Scan DEX positions (liquidity pools)
 */
export async function getDexPositions(
  walletAddress: string,
  apiKey: string
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  try {
    const query = `
      query GetDexPositions($owner_address: String!) {
        current_coin_balances(
          where: {
            owner_address: {_eq: $owner_address}
            amount: {_gt: 0}
            coin_type: {
              _or: [
                {_ilike: "%LP%"}
                {_ilike: "%Pool%"}
                {_ilike: "%liquidity%"}
              ]
            }
          }
        ) {
          coin_type
          amount
        }
      }
    `;

    const result = await graphQLRequest(
      INDEXER,
      {
        query,
        variables: {
          owner_address: walletAddress,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const typedResult = result as CoinBalanceGraphQLResponse;
    if (typedResult.data?.current_coin_balances) {
      for (const balance of typedResult.data.current_coin_balances) {
        const coinType = balance.coin_type;
        const amount = parseFloat(balance.amount);
        const decimals = getTokenDecimals(coinType);
        const adjustedAmount = amount / 10 ** decimals;

        if (adjustedAmount > 0.001) {
          const protocol = identifyProtocol(coinType);
          const symbol = getTokenSymbol(coinType);

          positions.push({
            id: `dex-${coinType}-${walletAddress}`,
            positionId: `dex-${coinType}-${walletAddress}`,
            protocol: protocol.protocol,
            protocolType: "lp",
            type: "lp",
            address: walletAddress,
            totalValue: 0,
            totalValueUSD: 0,
            assets: [
              {
                type: "supplied",
                tokenAddress: coinType,
                symbol,
                amount: adjustedAmount.toString(),
                valueUSD: 0,
              },
            ],
            position: {
              supplied: [
                {
                  asset: coinType,
                  amount: adjustedAmount.toString(),
                  value: 0,
                },
              ],
            },
          });
        }
      }
    }

    logger.info(`Found ${positions.length} DEX positions`);
  } catch (error) {
    logger.error("Failed to get DEX positions", { error });
  }

  return positions;
}

/**
 * Scan farming positions
 */
export async function getFarmingPositions(
  walletAddress: string,
  apiKey: string
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  try {
    const query = `
      query GetFarmingPositions($owner_address: String!) {
        account_transactions(
          where: {
            account_address: {_eq: $owner_address}
            type: {_in: ["user_transaction"]}
          }
          order_by: {transaction_version: desc}
          limit: 50
        ) {
          transaction_version
          user_transaction {
            entry_function_id_str
          }
        }
      }
    `;

    const result = await graphQLRequest(
      INDEXER,
      {
        query,
        variables: {
          owner_address: walletAddress,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const typedResult = result as TransactionGraphQLResponse;
    if (typedResult.data?.account_transactions) {
      const farmingTxs = typedResult.data.account_transactions.filter(
        (tx: Transaction) =>
          tx.user_transaction?.entry_function_id_str?.includes("farm") ||
          tx.user_transaction?.entry_function_id_str?.includes("stake") ||
          tx.user_transaction?.entry_function_id_str?.includes("reward")
      );

      logger.info(`Found ${farmingTxs.length} farming transactions`);
      // Would need protocol-specific logic to determine current farming positions
    }

    logger.info(`Found ${positions.length} farming positions`);
  } catch (error) {
    logger.error("Failed to get farming positions", { error });
  }

  return positions;
}

/**
 * Scan derivatives positions
 */
export async function getDerivativesPositions(
  walletAddress: string,
  apiKey: string
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  try {
    const query = `
      query GetDerivativesPositions($owner_address: String!) {
        current_coin_balances(
          where: {
            owner_address: {_eq: $owner_address}
            amount: {_gt: 0}
            coin_type: {
              _or: [
                {_ilike: "%perp%"}
                {_ilike: "%future%"}
                {_ilike: "%option%"}
                {_ilike: "%derivative%"}
              ]
            }
          }
        ) {
          coin_type
          amount
        }
      }
    `;

    const result = await graphQLRequest(
      INDEXER,
      {
        query,
        variables: {
          owner_address: walletAddress,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const typedResult = result as CoinBalanceGraphQLResponse;
    if (typedResult.data?.current_coin_balances) {
      for (const balance of typedResult.data.current_coin_balances) {
        const coinType = balance.coin_type;
        const amount = parseFloat(balance.amount);
        const decimals = getTokenDecimals(coinType);
        const adjustedAmount = amount / 10 ** decimals;

        if (adjustedAmount > 0.001) {
          const protocol = identifyProtocol(coinType);
          const symbol = getTokenSymbol(coinType);

          positions.push({
            id: `deriv-${coinType}-${walletAddress}`,
            positionId: `deriv-${coinType}-${walletAddress}`,
            protocol: protocol.protocol,
            protocolType: "derivatives",
            type: "derivatives",
            address: walletAddress,
            totalValue: 0,
            totalValueUSD: 0,
            assets: [
              {
                type: "supplied",
                tokenAddress: coinType,
                symbol,
                amount: adjustedAmount.toString(),
                valueUSD: 0,
              },
            ],
            position: {
              supplied: [
                {
                  asset: coinType,
                  amount: adjustedAmount.toString(),
                  value: 0,
                },
              ],
            },
          });
        }
      }
    }

    logger.info(`Found ${positions.length} derivatives positions`);
  } catch (error) {
    logger.error("Failed to get derivatives positions", { error });
  }

  return positions;
}

/**
 * Scan bridge positions
 */
export async function getBridgePositions(
  walletAddress: string,
  apiKey: string
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  try {
    const query = `
      query GetBridgePositions($owner_address: String!) {
        current_coin_balances(
          where: {
            owner_address: {_eq: $owner_address}
            amount: {_gt: 0}
            coin_type: {
              _or: [
                {_ilike: "%bridge%"}
                {_ilike: "%wormhole%"}
                {_ilike: "%layerzero%"}
                {_ilike: "%celer%"}
              ]
            }
          }
        ) {
          coin_type
          amount
        }
      }
    `;

    const result = await graphQLRequest(
      INDEXER,
      {
        query,
        variables: {
          owner_address: walletAddress,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const typedResult = result as CoinBalanceGraphQLResponse;
    if (typedResult.data?.current_coin_balances) {
      for (const balance of typedResult.data.current_coin_balances) {
        const coinType = balance.coin_type;
        const amount = parseFloat(balance.amount);
        const decimals = getTokenDecimals(coinType);
        const adjustedAmount = amount / 10 ** decimals;

        if (adjustedAmount > 0.001) {
          const protocol = identifyProtocol(coinType);
          const symbol = getTokenSymbol(coinType);

          positions.push({
            id: `bridge-${coinType}-${walletAddress}`,
            positionId: `bridge-${coinType}-${walletAddress}`,
            protocol: protocol.protocol,
            protocolType: "token",
            type: "token",
            address: walletAddress,
            totalValue: 0,
            totalValueUSD: 0,
            assets: [
              {
                type: "supplied",
                tokenAddress: coinType,
                symbol,
                amount: adjustedAmount.toString(),
                valueUSD: 0,
              },
            ],
            position: {
              supplied: [
                {
                  asset: coinType,
                  amount: adjustedAmount.toString(),
                  value: 0,
                },
              ],
            },
          });
        }
      }
    }

    logger.info(`Found ${positions.length} bridge positions`);
  } catch (error) {
    logger.error("Failed to get bridge positions", { error });
  }

  return positions;
}
