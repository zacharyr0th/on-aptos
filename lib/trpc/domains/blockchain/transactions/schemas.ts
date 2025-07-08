import { z } from 'zod';

export const aptosAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address');

export const transactionFilterSchema = z.object({
  types: z
    .array(
      z.enum([
        'coin_deposit',
        'coin_withdraw',
        'coin_transfer',
        'token_mint',
        'token_burn',
        'token_transfer',
        'token_swap',
        'nft_mint',
        'nft_transfer',
        'nft_burn',
        'smart_contract',
        'script',
        'module_publish',
        'state_checkpoint',
        'block_metadata',
        'user_transaction',
        'genesis',
        'unknown',
      ])
    )
    .optional(),
  categories: z
    .array(
      z.enum([
        'transfer',
        'defi',
        'nft',
        'staking',
        'governance',
        'system',
        'other',
      ])
    )
    .optional(),
  success: z.boolean().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  currency: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  verifiedOnly: z.boolean().optional(),
});

export const getTransactionsSchema = z.object({
  walletAddress: aptosAddressSchema,
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  filter: transactionFilterSchema.optional(),
});

export const getTransactionDetailSchema = z.object({
  version: z.string(),
});

export const getTransactionStatsSchema = z.object({
  walletAddress: aptosAddressSchema,
  days: z.number().min(1).max(365).default(30),
});

export const searchTransactionsSchema = z.object({
  walletAddress: aptosAddressSchema,
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(10),
});
