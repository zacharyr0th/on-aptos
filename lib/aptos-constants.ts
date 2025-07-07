/**
 * Comprehensive Aptos blockchain constants and utilities
 * This file consolidates all Aptos-specific constants for easy access
 */

import { PROTOCOLS, getProtocolByAddress, getProtocolLabel } from './protocol-registry';

/**
 * Core Aptos constants
 */
export const APTOS_CORE = {
  OCTA: 100_000_000,
  FRAMEWORK_ADDRESS: '0x1',
  TOKEN_V2_ADDRESS: '0x4',
  APTOS_COIN_FA_ADDRESS: '0xa',
  APTOS_COIN_TYPE: '0x1::aptos_coin::AptosCoin',
} as const;

/**
 * Core resource types
 */
export const APTOS_RESOURCES = {
  OBJECT_CORE: '0x1::object::ObjectCore',
  FA_METADATA: '0x1::fungible_asset::Metadata',
  TOKEN_V2: '0x4::token::Token',
  COLLECTION_V2: '0x4::collection::Collection',
} as const;

/**
 * Known protocol addresses derived from protocol registry
 */
export const PROTOCOL_ADDRESSES: Record<string, string> = Object.fromEntries(
  Object.values(PROTOCOLS).flatMap(protocol =>
    protocol.addresses.map(address => [address, protocol.name])
  )
);

/**
 * Protocol labels for UI display
 */
export const PROTOCOL_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(PROTOCOLS).flatMap(protocol =>
    protocol.addresses.map(address => [address, protocol.label])
  )
);

/**
 * Categorized protocol addresses by type
 */
export const PROTOCOLS_BY_TYPE = {
  LIQUID_STAKING: Object.values(PROTOCOLS)
    .filter(p => p.type === 'liquid_staking')
    .flatMap(p => p.addresses),
  LENDING: Object.values(PROTOCOLS)
    .filter(p => p.type === 'lending')
    .flatMap(p => p.addresses),
  BRIDGE: Object.values(PROTOCOLS)
    .filter(p => p.type === 'bridge')
    .flatMap(p => p.addresses),
  FARMING: Object.values(PROTOCOLS)
    .filter(p => p.type === 'farming')
    .flatMap(p => p.addresses),
  DEX: Object.values(PROTOCOLS)
    .filter(p => p.type === 'dex')
    .flatMap(p => p.addresses),
  DERIVATIVES: Object.values(PROTOCOLS)
    .filter(p => p.type === 'derivatives')
    .flatMap(p => p.addresses),
  INFRASTRUCTURE: Object.values(PROTOCOLS)
    .filter(p => p.type === 'infrastructure')
    .flatMap(p => p.addresses),
} as const;

/**
 * Native and stablecoin addresses
 */
export const NATIVE_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  APT_FA: '0x000000000000000000000000000000000000000000000000000000000000000a',
} as const;

export const STABLECOINS = {
  USDC: '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
  USDT: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
  USDE: '0xf37a8864fe737eb8ec2c2931047047cbaed1beed3fb0e5b7c5526dafd3b9c2e9',
  SUSDE: '0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69',
} as const;

/**
 * Liquid staking tokens
 */
export const LIQUID_STAKING_TOKENS = {
  THAPT: '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6',
  AMAPT: '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a',
  TRUFIN: '0x6f8ca77dd0a4c65362f475adb1c26ae921b1d75aa6b70e53d0e340efd7d8bc80',
} as const;

/**
 * Bridge token patterns
 */
export const BRIDGE_TOKENS = {
  LAYERZERO_PATTERN: /0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::.*/,
  WORMHOLE_PATTERN: /0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625::.*/,
  CELER_PATTERN: /0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::.*/,
} as const;

/**
 * Popular token symbols and their addresses
 */
export const TOKEN_REGISTRY = {
  // Native
  APT: NATIVE_TOKENS.APT,
  
  // Stablecoins
  USDC: STABLECOINS.USDC,
  USDT: STABLECOINS.USDT,
  USDE: STABLECOINS.USDE,
  SUSDE: STABLECOINS.SUSDE,
  
  // Liquid staking
  THAPT: LIQUID_STAKING_TOKENS.THAPT,
  AMAPT: LIQUID_STAKING_TOKENS.AMAPT,
  
  // Other tokens
  BUIDL: '0x50038be55be5b964cfa32cf128b5cf05f123959f286b4cc02b86cafd48945f89',
  ACRED: '0xe528f4df568eb9fff6398adc514bc9585fab397f478972bcbebf1e75dee40a88',
  MYCO: '0x98e39700e0bc5420d0a5c461a5420f1a17358041761f64147b173dfb9e21052d',
  NIGHT: '0xef0d49f03e48dbd055c3a369f74a304c366bda148005ddf6bb881ced79da0b09',
  AMA: '0xd0ab8c2f76cd640455db56ca758a9766a966c88f77920347aac1719edab1df5e',
  PACT: '0xc546cc2dd26d9e9a4516b4514288bedf1085259fcb106b84b6469337f527fb92',
  EXPO: '0xed18be0ea061c29dbbd2d22e9eb6bc61fde0babd1579c169bdd1d4f74730c419',
  RWD: '0xc9a5d270bb8bb47e7bb34377ceb529db2878e4a7b521b5b8a984b35f8feaa8e2',
  ECHO: '0xb2c7780f0a255a6137e5b39733f5a4c85fe093c549de5c359c1232deef57d1b7',
} as const;

/**
 * NFT and marketplace addresses
 */
export const NFT_PLATFORMS = {
  WAPAL_MARKETPLACE: '0x584b50b999c78ade62f8359c91b5165ff390338d45f8e55969a04e65d76258c9',
  WAPAL_AGGREGATOR: '0x7ccf0e6e871977c354c331aa0fccdffb562d9fceb27e3d7f61f8e12e470358e9',
  TOPAZ: '0x2c7bccf7b31baf770fdbcc768d9e9cb3d87805e255355df5db32ac9a669010a2',
  BLUEMOVE: '0xd1fd99c1944b84d1670a2536417e997864ad12303d19eac725891691b04d614e',
  TRADEPORT: '0xe11c12ec495f3989c35e1c6a0af414451223305b579291fc8f3d9d0575a23c26',
  RARIBLE: '0x465a0051e8535859d4794f0af24dbf35c5349bedadab26404b20b825035ee790',
  OKX_MARKETPLACE: '0x1e6009ce9d288f3d5031c06ca0b19a334214ead798a0cb38808485bd6d997a43',
} as const;

/**
 * Oracle addresses
 */
export const ORACLES = {
  PYTH: '0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387',
  SWITCHBOARD_1: '0x07d7e436f0b2aafde60774efb26ccc432cf881b677aca7faaf2a01879bd19fb8',
  SWITCHBOARD_2: '0xfea54925b5ac1912331e2e62049849b37842efaea298118b66f85a59057752b8',
  CHAINLINK_1: '0xfb7ebc84ce674c3c1f7a789a30084d2227056982fb430dfd8b18c8f7737f4f57',
  CHAINLINK_2: '0x9976bb288ed9177b542d568fa1ac386819dc99141630e582315804840f41928a',
  THALA: '0x092e95ed77b5ac815d3fbc2227e76db238339e9ca43ace45031ec2589bea5b8c',
} as const;

/**
 * CEX addresses (for identification purposes)
 */
export const CEX_ADDRESSES = {
  BINANCE: [
    '0xd91c64b777e51395c6ea9dec562ed79a4afa0cd6dad5a87b187c37198a1f855a',
    '0x80174e0fe8cb2d32b038c6c888dd95c3e1560736f0d4a6e8bed6ae43b5c91f6f',
    '0xae1a6f3d3daccaf77b55044cea133379934bba04a11b9d0bbd643eae5e6e9c70',
  ],
  COINBASE: [
    '0x0b3581f46ac8a6920fc9b87fecb7b459b9b39c177e65233826a7b4978bad41cd',
    '0xa4e7455d27731ab857e9701b1e6ed72591132b909fe6e4fd99b66c1d6318d9e8',
  ],
  OKX: [
    '0x834d639b10d20dcb894728aa4b9b572b2ea2d97073b10eacb111f338b20ea5d7',
    '0x8f347361a9461e9312a4d2b5b5b928c65c3a740965705361317e3ca0015c64d8',
  ],
  BYBIT: ['0x84b1675891d370d5de8f169031f9c3116d7add256ecf50a4bc71e3135ddba6e0'],
  KRAKEN: ['0xdc7adffa09da5736ce1303f7441f4367fa423617c6822ad2fbc8522d9efd8fa4'],
  GATE: ['0x0cf869189c785beaaad2f5c636ced4805aeae9cbf49070dc93aed2f16b99012a'],
} as const;

/**
 * Utility functions for working with Aptos addresses
 */
export const AptosUtils = {
  /**
   * Check if an address is a known protocol
   */
  isProtocolAddress: (address: string): boolean => {
    return address in PROTOCOL_ADDRESSES;
  },

  /**
   * Get protocol name from address
   */
  getProtocolName: (address: string): string | null => {
    return PROTOCOL_ADDRESSES[address] || null;
  },

  /**
   * Get protocol label for UI display
   */
  getProtocolLabel: (assetType: string): string | null => {
    return getProtocolLabel(assetType);
  },

  /**
   * Check if address is a CEX
   */
  isCEXAddress: (address: string): boolean => {
    return Object.values(CEX_ADDRESSES).some((addresses: readonly string[]) => 
      addresses.includes(address)
    );
  },

  /**
   * Check if address is an NFT platform
   */
  isNFTPlatform: (address: string): boolean => {
    return (Object.values(NFT_PLATFORMS) as readonly string[]).includes(address);
  },

  /**
   * Check if token is a stablecoin
   */
  isStablecoin: (address: string): boolean => {
    return (Object.values(STABLECOINS) as readonly string[]).includes(address);
  },

  /**
   * Check if token is a liquid staking token
   */
  isLiquidStakingToken: (address: string): boolean => {
    return (Object.values(LIQUID_STAKING_TOKENS) as readonly string[]).includes(address);
  },

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

/**
 * Export protocol registry functions for convenience
 */
export { 
  PROTOCOLS, 
  getProtocolByAddress, 
  getProtocolLabel,
  isPhantomAsset,
  getPhantomReason 
} from './protocol-registry';