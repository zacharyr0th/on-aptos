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

// Fail fast in production if critical keys are missing
if (process.env.NODE_ENV === 'production') {
  const missingKeys: string[] = [];
  
  if (!env.CMC_API_KEY) missingKeys.push('CMC_API_KEY');
  if (!env.PANORA_API_KEY) missingKeys.push('PANORA_API_KEY');
  if (!env.APTOS_BUILD_SECRET) missingKeys.push('APTOS_BUILD_SECRET');
  
  if (missingKeys.length > 0) {
    throw new Error(
      `FATAL: Missing required API keys in production: ${missingKeys.join(', ')}. ` +
      'Application cannot start without these keys.'
    );
  }
}

// Only warn in development
if (process.env.NODE_ENV !== 'production') {
  if (!env.CMC_API_KEY) {
    console.warn('⚠️  CMC_API_KEY not configured - CoinMarketCap price data will fail');
  }
  if (!env.PANORA_API_KEY) {
    console.warn('⚠️  PANORA_API_KEY not configured - Panora Exchange data will fail');
  }
  if (!env.APTOS_BUILD_SECRET) {
    console.warn('⚠️  APTOS_BUILD_SECRET not configured - Aptos Indexer queries will fail');
  }
}

// Type-safe environment variable access
export function getEnvVar<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return env[key];
}

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper to check if we're in test
export const isTest = env.NODE_ENV === 'test';
