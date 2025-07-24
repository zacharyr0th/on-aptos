/**
 * Aptos Validation Schemas and Utilities
 * Zod schemas and utility functions for Aptos addresses and types
 */

import { z } from 'zod';

/**
 * Zod validation schemas for type safety and runtime validation
 */
export const AptosValidationSchemas = {
  /**
   * Aptos address validation - handles both full and short formats
   */
  aptosAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address format'),

  /**
   * Full asset type validation (includes module and resource)
   */
  assetType: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{1,64}(::[a-zA-Z_][a-zA-Z0-9_]*)*$/,
      'Invalid Aptos asset type format'
    ),
} as const;

/**
 * Runtime validation functions with proper error handling
 */
export const AptosValidators = {
  /**
   * Validate any Aptos address format
   */
  validateAddress: (address: string): { isValid: boolean; error?: string } => {
    try {
      AptosValidationSchemas.aptosAddress.parse(address);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error:
          error instanceof z.ZodError
            ? error.errors[0]?.message
            : 'Invalid address format',
      };
    }
  },

  /**
   * Validate asset type format
   */
  validateAssetType: (
    assetType: string
  ): { isValid: boolean; error?: string } => {
    try {
      AptosValidationSchemas.assetType.parse(assetType);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error:
          error instanceof z.ZodError
            ? error.errors[0]?.message
            : 'Invalid asset type format',
      };
    }
  },
} as const;

/**
 * Utility functions for working with Aptos addresses
 */
export const AptosUtils = {
  /**
   * Format address for display (short form)
   */
  formatAddress: (address: string, chars = 6): string => {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  },

  /**
   * Normalize address format
   */
  normalizeAddress: (address: string): string => {
    // Remove leading zeros and ensure 0x prefix
    const cleaned = address.replace(/^0x0+/, '0x') || '0x0';
    return cleaned === '0x' ? '0x0' : cleaned;
  },
} as const;
