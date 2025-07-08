import { router, publicProcedure } from '@/lib/trpc/core/server';
import { TRPCError } from '@trpc/server';
import {
  getTransactionsSchema,
  getTransactionDetailSchema,
  getTransactionStatsSchema,
  searchTransactionsSchema,
} from './schemas';
import { TransactionService } from './services';
import { buildSuccessResponse } from '@/lib/utils/response-builder';

export const transactionRouter = router({
  /**
   * Get transaction history for a wallet address
   */
  getTransactions: publicProcedure
    .input(getTransactionsSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        const { walletAddress, limit, offset, filter } = input;

        const transactions = await TransactionService.getTransactions(
          walletAddress,
          limit,
          offset,
          filter
        );

        return buildSuccessResponse(transactions, { startTime });
      } catch (error) {
        console.error('Error in getTransactions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch transactions',
        });
      }
    }),

  /**
   * Get detailed information for a specific transaction
   */
  getTransactionDetail: publicProcedure
    .input(getTransactionDetailSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        const { version } = input;

        const transaction =
          await TransactionService.getTransactionDetail(version);

        if (!transaction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          });
        }

        return buildSuccessResponse(transaction, { startTime });
      } catch (error) {
        console.error('Error in getTransactionDetail:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch transaction details',
        });
      }
    }),

  /**
   * Get transaction statistics for a wallet
   */
  getTransactionStats: publicProcedure
    .input(getTransactionStatsSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        const { walletAddress, days } = input;

        const stats = await TransactionService.getTransactionStats(
          walletAddress,
          days
        );

        return buildSuccessResponse(stats, { startTime });
      } catch (error) {
        console.error('Error in getTransactionStats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate transaction statistics',
        });
      }
    }),

  /**
   * Search transactions by various criteria
   */
  searchTransactions: publicProcedure
    .input(searchTransactionsSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        const { walletAddress, query, limit } = input;

        // Get transactions and filter by search query
        const allTransactions = await TransactionService.getTransactions(
          walletAddress,
          100
        );

        const searchResults = allTransactions
          .filter(tx => {
            const searchLower = query.toLowerCase();
            return (
              tx.type.toLowerCase().includes(searchLower) ||
              tx.category.toLowerCase().includes(searchLower) ||
              tx.currency?.toLowerCase().includes(searchLower) ||
              tx.entry_function?.toLowerCase().includes(searchLower) ||
              tx.hash?.toLowerCase().includes(searchLower) ||
              tx.version.includes(query)
            );
          })
          .slice(0, limit);

        return buildSuccessResponse(searchResults, { startTime });
      } catch (error) {
        console.error('Error in searchTransactions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to search transactions',
        });
      }
    }),
});
