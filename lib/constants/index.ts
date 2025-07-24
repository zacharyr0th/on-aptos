/**
 * Consolidated Constants Export
 * Single entry point for all application constants
 */

// API Configuration
export * from './api/endpoints';
export * from './api/cache';
export * from './api/retry';

// Aptos Core
export * from './aptos/core';
export * from './aptos/validation';

// Token Definitions
export * from './tokens/decimals';
export * from './tokens/stablecoins';

// UI Configuration
export * from './ui/colors';
export * from './ui/thresholds';

// Protocol Registry
export * from './protocols/registry';

/**
 * Legacy re-exports for backwards compatibility
 * These can be removed once all imports are updated
 */

// Token registry for backwards compatibility
export const TOKEN_REGISTRY = {
  // Native
  APT: '0x1::aptos_coin::AptosCoin',

  // Stablecoins (from new structure)
  USDC: '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
  USDT: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
  USDE: '0xf37a8864fe737eb8ec2c2931047047cbaed1beed3fb0e5b7c5526dafd3b9c2e9',
  SUSDE: '0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69',


  // Other tokens
  BUIDL: '0x50038be55be5b964cfa32cf128b5cf05f123959f286b4cc02b86cafd48945f89',
  ACRED: '0xe528f4df568eb9fff6398adc514bc9585fab397f478972bcbebf1e75dee40a88',
  MYCO: '0x98e39700e0bc5420d0a5c461a5420f1a17358041761f64147b173dfb9e21052d',
  NIGHT: '0xef0d49f03e48dbd055c3a369f74a304c366bda148005ddf6bb881ced79da0b09',
  AMA: '0xd0ab8c2f76cd640455db56ca758a9766a966c88f77920347aac1719edab1df5e',
  PACT: '0xc546cc2dd26d9e9a4516b4514288bedf1085259fcb106b84b6469337f527fb92',
  EXPO: '0xed18be0ea061c29dbbd2d22e9eb6bc61fde0babd1579c169bdd1d4f7730c419',
  RWD: '0xc9a5d270bb8bb47e7bb34377ceb529db2878e4a7b521b5b8a984b35f8feaa8e2',
  ECHO: '0xb2c7780f0a255a6137e5b39733f5a4c85fe093c549de5c359c1232deef57d1b7',
} as const;
