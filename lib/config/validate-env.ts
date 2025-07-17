import { z } from 'zod';

const envSchema = z.object({
  // API Keys - validated after parsing
  CMC_API_KEY: z.string().optional(),
  RWA_API_KEY: z.string().optional(),
  PANORA_API_KEY: z.string().optional(),
  APTOS_BUILD_SECRET: z.string().optional(),
  APTOS_BUILD_KEY: z.string().optional(),

  // Public URLs - optional with default
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:3000'),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Optional API keys for extended functionality
  VERCEL_URL: z.string().optional(),
  ANALYZE: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());

    const missingVars = result.error.errors
      .filter(err => err.message.includes('required'))
      .map(err => err.path.join('.'));

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
          'Please check your .env file and ensure all required variables are set.'
      );
    }

    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

// Export validated env for use throughout the app
export const env = validateEnv();

// Runtime validation for production (not at build time)
export function validateProductionEnv() {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    const missingKeys: string[] = [];

    // ALL THREE are required for production
    if (!env.CMC_API_KEY) missingKeys.push('CMC_API_KEY');
    if (!env.PANORA_API_KEY) missingKeys.push('PANORA_API_KEY');
    if (!env.APTOS_BUILD_SECRET) missingKeys.push('APTOS_BUILD_SECRET');

    if (missingKeys.length > 0) {
      console.error(
        `FATAL: Missing required API keys in production: ${missingKeys.join(', ')}. ` +
          'Application cannot function properly without these keys.'
      );
      // Don't throw during build, but log the error
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        throw new Error(`Missing required API keys: ${missingKeys.join(', ')}`);
      }
    }
  }
}

// Only warn in development
if (process.env.NODE_ENV !== 'production') {
  if (!env.CMC_API_KEY) {
    console.warn(
      '⚠️  CMC_API_KEY not configured - CoinMarketCap price data will fail'
    );
  }
  if (!env.PANORA_API_KEY) {
    console.warn(
      '⚠️  PANORA_API_KEY not configured - Panora Exchange data will fail'
    );
  }
  if (!env.APTOS_BUILD_SECRET) {
    console.warn(
      '⚠️  APTOS_BUILD_SECRET not configured - Aptos Indexer queries may hit rate limits'
    );
  }
}

// Type-safe environment variable access
export function getEnvVar<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const value = env[key];
  if (
    process.env.NODE_ENV === 'development' &&
    (key === 'APTOS_BUILD_KEY' || key === 'APTOS_BUILD_SECRET')
  ) {
    console.log(
      `[ENV] Getting ${key}:`,
      value ? `${value.substring(0, 10)}...` : 'undefined'
    );
  }
  return value;
}

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper to check if we're in test
export const isTest = env.NODE_ENV === 'test';
