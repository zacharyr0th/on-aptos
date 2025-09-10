/**
 * Zod validation schemas and utility functions
 * Moved from aptos-constants.ts
 */

import { z } from "zod";

/**
 * Zod validation schemas for type safety and runtime validation
 * Ensures all addresses and constants are properly formatted
 */
export const AptosValidationSchemas = {
  /**
   * Aptos address validation - handles both full and short formats
   */
  aptosAddress: z.string().regex(/^0x[a-fA-F0-9]{1,64}$/, "Invalid Aptos address format"),

  /**
   * Full asset type validation (includes module and resource)
   */
  assetType: z
    .string()
    .regex(/^0x[a-fA-F0-9]{1,64}(::[a-zA-Z_][a-zA-Z0-9_]*)*$/, "Invalid Aptos asset type format"),

  /**
   * Protocol validation
   */
  protocolAddress: z.string(),
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
            ? (error as any).errors[0]?.message
            : "Invalid address format",
      };
    }
  },

  /**
   * Validate asset type format
   */
  validateAssetType: (assetType: string): { isValid: boolean; error?: string } => {
    try {
      AptosValidationSchemas.assetType.parse(assetType);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error:
          error instanceof z.ZodError
            ? (error as any).errors[0]?.message
            : "Invalid asset type format",
      };
    }
  },
} as const;
