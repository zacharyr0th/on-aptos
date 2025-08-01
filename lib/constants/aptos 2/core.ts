/**
 * Core Aptos Blockchain Constants
 * Fundamental Aptos constants and addresses
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
 * Native token addresses
 */
export const NATIVE_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  APT_FA: '0x000000000000000000000000000000000000000000000000000000000000000a',
} as const;

/**
 * Bridge token patterns for identification
 */
export const BRIDGE_TOKENS = {
  LAYERZERO_PATTERN:
    /0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::.*/,
  WORMHOLE_PATTERN:
    /0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625::.*/,
  CELER_PATTERN:
    /0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::.*/,
} as const;

/**
 * NFT and marketplace addresses
 */
export const NFT_PLATFORMS = {
  WAPAL_MARKETPLACE:
    '0x584b50b999c78ade62f8359c91b5165ff390338d45f8e55969a04e65d76258c9',
  WAPAL_AGGREGATOR:
    '0x7ccf0e6e871977c354c331aa0fccdffb562d9fceb27e3d7f61f8e12e470358e9',
  TOPAZ: '0x2c7bccf7b31baf770fdbcc768d9e9cb3d87805e255355df5db32ac9a669010a2',
  BLUEMOVE:
    '0xd1fd99c1944b84d1670a2536417e997864ad12303d19eac725891691b04d614e',
  TRADEPORT:
    '0xe11c12ec495f3989c35e1c6a0af414451223305b579291fc8f3d9d0575a23c26',
  RARIBLE: '0x465a0051e8535859d4794f0af24dbf35c5349bedadab26404b20b825035ee790',
  OKX_MARKETPLACE:
    '0x1e6009ce9d288f3d5031c06ca0b19a334214ead798a0cb38808485bd6d997a43',
} as const;

/**
 * Oracle addresses
 */
export const ORACLES = {
  PYTH: '0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387',
  SWITCHBOARD_1:
    '0x07d7e436f0b2aafde60774efb26ccc432cf881b677aca7faaf2a01879bd19fb8',
  SWITCHBOARD_2:
    '0xfea54925b5ac1912331e2e62049849b37842efaea298118b66f85a59057752b8',
  CHAINLINK_1:
    '0xfb7ebc84ce674c3c1f7a789a30084d2227056982fb430dfd8b18c8f7737f4f57',
  CHAINLINK_2:
    '0x9976bb288ed9177b542d568fa1ac386819dc99141630e582315804840f41928a',
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
  KRAKEN: [
    '0xdc7adffa09da5736ce1303f7441f4367fa423617c6822ad2fbc8522d9efd8fa4',
  ],
  GATE: ['0x0cf869189c785beaaad2f5c636ced4805aeae9cbf49070dc93aed2f16b99012a'],
} as const;
