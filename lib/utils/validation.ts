/**
 * Enterprise-grade input validation utilities
 * Using Zod for runtime type checking and validation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { APIResponses } from './api-response';

// Base validation schemas
export const AptosAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{1,64}$/, 'Invalid Aptos address format')
  .transform(addr => addr.toLowerCase());

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).optional(),
});

export const BooleanSchema = z
  .union([z.boolean(), z.string()])
  .transform(val => {
    if (typeof val === 'boolean') return val;
    return val.toLowerCase() === 'true';
  });

// API-specific validation schemas
export const WalletParamsSchema = z.object({
  walletAddress: AptosAddressSchema,
});

export const PortfolioAssetsQuerySchema = z
  .object({
    walletAddress: AptosAddressSchema,
    showOnlyVerified: BooleanSchema.default(true),
    forceRefresh: BooleanSchema.default(false),
  })
  .merge(PaginationSchema.partial());

export const PortfolioNFTsQuerySchema = z
  .object({
    walletAddress: AptosAddressSchema,
    limit: z.coerce.number().int().min(1).max(100).default(30),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .merge(PaginationSchema.partial());

export const PortfolioDeFiQuerySchema = z.object({
  walletAddress: AptosAddressSchema,
  includePositions: BooleanSchema.default(true),
  forceRefresh: BooleanSchema.default(false),
});

export const PriceQuerySchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  currency: z.string().default('USD'),
  forceRefresh: BooleanSchema.default(false),
});

export const ANSQuerySchema = z
  .object({
    address: AptosAddressSchema.optional(),
    name: z.string().min(1).max(100).optional(),
  })
  .refine(data => data.address || data.name, {
    message: 'Either address or name must be provided',
  });

export const NFTTransferHistoryQuerySchema = z.object({
  tokenDataId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const TokenSupplyQuerySchema = z.object({
  forceRefresh: BooleanSchema.default(false),
  includeMetadata: BooleanSchema.default(true),
});

/**
 * Validate and parse query parameters from NextRequest
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: any } {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[]> = {};

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle multiple values for same key
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    });

    const parsed = schema.parse(params);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          type: 'validation',
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'unknown',
        message:
          error instanceof Error ? error.message : 'Unknown validation error',
      },
    };
  }
}

/**
 * Validate JSON body from NextRequest
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          type: 'validation',
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
      };
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: {
          type: 'json',
          message: 'Invalid JSON in request body',
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'unknown',
        message:
          error instanceof Error ? error.message : 'Unknown validation error',
      },
    };
  }
}

/**
 * Higher-order function to create validated API handlers
 */
export function withValidation<TQuery = any, TBody = any>(
  querySchema?: z.ZodSchema<TQuery>,
  bodySchema?: z.ZodSchema<TBody>
) {
  return function (
    handler: (params: {
      query?: TQuery;
      body?: TBody;
      request: NextRequest;
    }) => Promise<any>
  ) {
    return async function (request: NextRequest) {
      let validatedQuery: TQuery | undefined;
      let validatedBody: TBody | undefined;

      // Validate query parameters
      if (querySchema) {
        const queryResult = validateQuery(request, querySchema);
        if (!queryResult.success) {
          return APIResponses.invalidInput(
            'Invalid query parameters',
            queryResult.error
          );
        }
        validatedQuery = queryResult.data;
      }

      // Validate request body (for POST/PUT requests)
      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const bodyResult = await validateBody(request, bodySchema);
        if (!bodyResult.success) {
          return APIResponses.invalidInput(
            'Invalid request body',
            bodyResult.error
          );
        }
        validatedBody = bodyResult.data;
      }

      return handler({
        query: validatedQuery,
        body: validatedBody,
        request,
      });
    };
  };
}

/**
 * Sanitize input strings to prevent injection attacks
 */
export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate file uploads (for future use)
 */
export const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z
    .string()
    .refine(
      type => ['image/png', 'image/jpeg', 'image/gif'].includes(type),
      'Invalid file type'
    ),
  size: z.number().max(5 * 1024 * 1024), // 5MB max
});

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: z.string().email(),
  url: z.string().url(),
  uuid: z.string().uuid(),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Must be alphanumeric'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Must be a valid slug'),
} as const;
