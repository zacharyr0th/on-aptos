import { router, publicProcedure } from '@/lib/trpc/core/server';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import {
  getWalletAssets,
  getPortfolioHistory,
  getAssetPrices,
  getWalletNFTs,
  getNFTTransferHistory,
  calculatePortfolioMetrics,
  getWalletTransactions,
} from './services';
import { ansService } from './ans-service';
import { DeFiBalanceService } from './defi-balance-service';

export const portfolioRouter = router({
  getWalletAssets: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
        showOnlyVerified: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `Portfolio router: fetching assets for wallet ${input.walletAddress} (showOnlyVerified: ${input.showOnlyVerified}, automatic stablecoin filtering enabled)`
      );
      const result = await getWalletAssets(
        input.walletAddress,
        input.showOnlyVerified
      );
      logger.info(`Portfolio router: returning ${result.length} assets`);
      return result;
    }),

  getPortfolioHistory: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      return getPortfolioHistory(input.walletAddress, input.days);
    }),

  getAssetPrices: publicProcedure
    .input(
      z.object({
        assetTypes: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      return getAssetPrices(input.assetTypes);
    }),

  getWalletNFTs: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return getWalletNFTs(input.walletAddress, input.limit, input.offset);
    }),

  getNFTTransferHistory: publicProcedure
    .input(
      z.object({
        tokenDataId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `Portfolio router: fetching transfer history for NFT ${input.tokenDataId}`
      );
      const result = await getNFTTransferHistory(
        input.tokenDataId,
        input.limit
      );
      logger.info(
        `Portfolio router: returning ${result.length} transfer records`
      );
      return result;
    }),

  getPortfolioMetrics: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
        showOnlyVerified: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      return calculatePortfolioMetrics(
        input.walletAddress,
        input.showOnlyVerified
      );
    }),

  getWalletTransactions: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `Portfolio router: fetching transactions for wallet ${input.walletAddress}`
      );
      const result = await getWalletTransactions(
        input.walletAddress,
        input.limit
      );
      logger.info(`Portfolio router: returning ${result.length} transactions`);
      return result;
    }),

  // ANS-related procedures
  getPrimaryName: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `ANS router: getting primary name for wallet ${input.walletAddress}`
      );
      const result = await ansService.getPrimaryName(input.walletAddress);
      logger.info(`ANS router: primary name result: ${result || 'none'}`);
      return result;
    }),

  getAccountNames: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `ANS router: getting all names for wallet ${input.walletAddress}`
      );
      const result = await ansService.getAccountNames(input.walletAddress);
      logger.info(`ANS router: found ${result.length} names`);
      return result;
    }),

  getAccountDomains: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `ANS router: getting domains for wallet ${input.walletAddress}`
      );
      const result = await ansService.getAccountDomains(input.walletAddress);
      logger.info(`ANS router: found ${result.length} domains`);
      return result;
    }),

  resolveNameToAddress: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      logger.info(`ANS router: resolving name ${input.name} to address`);
      const result = await ansService.resolveNameToAddress(input.name);
      logger.info(`ANS router: resolved to address: ${result || 'none'}`);
      return result;
    }),

  getNameDetails: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      logger.info(`ANS router: getting details for name ${input.name}`);
      const result = await ansService.getNameDetails(input.name);
      logger.info(
        `ANS router: name details result: ${result ? 'found' : 'none'}`
      );
      return result;
    }),

  formatAddressForDisplay: publicProcedure
    .input(
      z.object({
        address: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
      })
    )
    .query(async ({ input }) => {
      const result = await ansService.formatAddressForDisplay(input.address);
      return result;
    }),

  // DeFi protocol balance procedures
  getDeFiPositions: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `DeFi router: fetching DeFi positions for wallet ${input.walletAddress}`
      );
      const result = await DeFiBalanceService.getDeFiPositions(
        input.walletAddress
      );
      logger.info(`DeFi router: found ${result.length} DeFi positions`);
      return result;
    }),

  getDeFiStats: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address'),
      })
    )
    .query(async ({ input }) => {
      logger.info(
        `DeFi router: calculating DeFi stats for wallet ${input.walletAddress}`
      );
      const result = await DeFiBalanceService.getDeFiStats(input.walletAddress);
      logger.info(
        `DeFi router: found ${result.totalPositions} positions worth $${result.totalValueLocked.toFixed(2)}`
      );
      return result;
    }),
});
