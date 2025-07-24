/**
 * Centralized protocol registry for contract identification and UI labeling
 * This is the single source of truth for all protocol-related information
 */

export interface ProtocolInfo {
  name: string;
  label: string; // Short label for UI display (e.g., "MKLP", "amAPT")
  type: ProtocolType;
  description?: string;
  addresses: string[];
}

export enum ProtocolType {
  LIQUID_STAKING = 'liquid_staking',
  LENDING = 'lending',
  BRIDGE = 'bridge',
  FARMING = 'farming',
  DEX = 'dex',
  DERIVATIVES = 'derivatives',
  INFRASTRUCTURE = 'infrastructure',
  NFT_MARKETPLACE = 'nft_marketplace',
}

/**
 * Master protocol registry - the source of truth for all protocol information
 */
export const PROTOCOLS: Record<string, ProtocolInfo> = {
  // Core Aptos
  APTOS_FRAMEWORK: {
    name: 'Aptos Framework',
    label: '0x1',
    type: ProtocolType.INFRASTRUCTURE,
    description: 'Core Aptos framework',
    addresses: [
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ],
  },
  APTOS_TOKEN_V2: {
    name: 'Digital Assets',
    label: '0x4',
    type: ProtocolType.INFRASTRUCTURE,
    description: 'Aptos token v2 standard',
    addresses: [
      '0x0000000000000000000000000000000000000000000000000000000000000004',
    ],
  },
  MERKLE_TRADE: {
    name: 'Merkle',
    label: 'MKLP',
    type: ProtocolType.DERIVATIVES,
    description: 'Derivatives trading protocol',
    addresses: [
      '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06',
    ],
  },
  AMNIS_FINANCE: {
    name: 'Amnis Finance',
    label: 'Amnis',
    type: ProtocolType.LIQUID_STAKING,
    description: 'Liquid staking protocol for APT',
    addresses: [
      '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a',
      '0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387',
      '0x6f09bf7a232a2159ce8b0af83d641d7bdeda0921f724764e94e4f9b2d7e0d261',
      '0x7893a5d6cd60610f2bad22bb29668e596d14245b682d508a0794ce69613bcaab',
    ],
  },
  THALA_LSD: {
    name: 'Thala Liquid Staking',
    label: 'thAPT',
    type: ProtocolType.LIQUID_STAKING,
    description: 'Thala liquid staking derivatives',
    addresses: [
      '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6',
    ],
  },
  // LAYERZERO: {
  //   name: 'LayerZero',
  //   label: 'LayerZero',
  //   type: ProtocolType.BRIDGE,
  //   description: 'Cross-chain messaging and bridging protocol',
  //   addresses: [
  //     '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa',
  //     '0x54ad3d30af77b60d939ae356e6606de9a4da67583f02b962d2d3f2e481484e90',
  //     '0x1d8727df513fa2a8785d0834e40b34223daff1affc079574082baadb74b66ee4',
  //     '0x43d8cad89263e6936921a0adb8d5d49f0e236c229460f01b14dca073114df2b9',
  //     '0xc2846ea05319c339b3b52186ceae40b43d4e9cf6c7350336c3eb0b351d9394eb',
  //     '0x12e12de0af996d9611b0b78928cd9f4cbf50d94d972043cdd829baa77a78929b',
  //     '0xc20ea5a196c81d8d7aff814aa37f8a5823acffbc4193efd3b2aafc9ef2803255',
  //   ],
  // },
  ARIES_MARKETS: {
    name: 'Aries',
    label: 'Aries',
    type: ProtocolType.LENDING,
    description: 'Lending and borrowing protocol',
    addresses: [
      '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3',
    ],
  },
  APTIN_FINANCE: {
    name: 'Aptin Finance',
    label: 'Aptin',
    type: ProtocolType.LENDING,
    description: 'Lending protocol',
    addresses: [
      '0x3c1d4a86594d681ff7e5d5a233965daeabdc6a15fe5672ceeda5260038857183',
      '0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896',
    ],
  },
  THALA_FARM: {
    name: 'Thala Farm',
    label: 'Thala Farm',
    type: ProtocolType.FARMING,
    description: 'Yield farming and liquidity pools',
    addresses: [
      '0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99',
      '0x3c4a58b4a8dffe6d14448072efcdd5a0e0089a22c6837b94f1d7e8bb1552137f',
      '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d',
    ],
  },
  PANCAKESWAP: {
    name: 'PancakeSwap',
    label: 'CAKE',
    type: ProtocolType.DEX,
    description: 'Decentralized exchange and farming',
    addresses: [
      '0x7968a225eba6c99f5f1070aeec1b405757dee939eabcfda43ba91588bf5fccf3',
      '0xfd1d8a523f1be89277ac0787ae3469312667e3d0b3f75a5f01bfc95530a2dc91',
      '0x9936836587ca33240d3d3f91844651b16cb07802faf5e34514ed6f78580deb0a',
      '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
    ],
  },
  // ECONIA: {
  //   name: 'Econia',
  //   label: 'Econia',
  //   type: ProtocolType.DEX,
  //   description: 'Order book DEX',
  //   addresses: [
  //     '0xc0deb00c405f84c85dc13442e305df75d1288100cdd82675695f6148c7ece51c',
  //   ],
  // },
  VIBRANTX: {
    name: 'VibrantX',
    label: 'VibrantX',
    type: ProtocolType.DEX,
    description: 'DeFi protocol',
    addresses: [
      '0x17f1e926a81639e9557f4e4934df93452945ec30bc962e11351db59eb0d78c33',
    ],
  },
  THALA_INFRA: {
    name: 'Thala Infrastructure',
    label: 'Thala',
    type: ProtocolType.INFRASTRUCTURE,
    description: 'Thala protocol infrastructure',
    addresses: [
      '0x9c6d58fa009e08dfb2f5928ded14b3a790a94131da89891466b41ba1e61d83e1',
      '0x4dcae85fc5559071906cd5c76b7420fcbb4b0a92f00ab40ffc394aadbbff5ee9',
      '0x93aa044a65a27bd89b163f8b3be3777b160b09a25c336643dcc2878dfd8f2a8d',
      '0x9e7309b2b63130211f5414c5efe2468bb725e884392dfca86b10975df25d78dd',
      '0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5', // ThalaSwap v2
      '0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26', // Thala router
      '0x1bf23f0881f8fa149500ff6b7a047f608967c028a8ad7a2100caa84833ce851d',
      '0xfb6e709add23c710c40e4844d889938f703719f72d2d4439ee682d67f07a15c5',
      '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
      '0x092e95ed77b5ac815d3fbc2227e76db238339e9ca43ace45031ec2589bea5b8c',
      '0x07fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615',
      '0x6970b4878c3aea96732be3f31c2dded12d94d9455ff0c76c67d84859dce35136',
    ],
  },
  THALA_CDP: {
    name: 'Thala CDP',
    label: 'MOD',
    type: ProtocolType.LENDING,
    description: 'Thala collateralized debt positions',
    addresses: [
      '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01',
    ],
  },
  // Additional lending protocols
  ECHELON: {
    name: 'Echelon',
    label: 'Echelon',
    type: ProtocolType.LENDING,
    description: 'Echelon lending protocol',
    addresses: [
      '0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba',
      '0x024c90c44edf46aa02c3e370725b918a59c52b5aa551388feb258bd5a1e82271',
    ],
  },
  ECHO_LENDING: {
    name: 'Echo Lending',
    label: 'Echo',
    type: ProtocolType.LENDING,
    description: 'Echo lending protocol',
    addresses: [
      '0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed',
      '0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec',
    ],
  },
  MESO_FINANCE: {
    name: 'Meso Finance',
    label: 'Meso',
    type: ProtocolType.LENDING,
    description: 'Meso lending protocol',
    addresses: [
      '0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7',
    ],
  },
  JOULE_FINANCE: {
    name: 'Joule Finance',
    label: 'Joule',
    type: ProtocolType.LENDING,
    description: 'Joule lending protocol',
    addresses: [
      '0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6',
      '0x3b90501eae5cdc53c507d53b4ddc5a37e620743ef0b53a6aa4f711118890d1e5',
    ],
  },
  SUPERPOSITION: {
    name: 'Superposition',
    label: 'Superposition',
    type: ProtocolType.LENDING,
    description: 'Superposition lending protocol',
    addresses: [
      '0xccd1a84ccea93531d7f165b90134aa0415feb30e8757ab1632dac68c0055f5c2',
    ],
  },
  AAVE: {
    name: 'Aave',
    label: 'AAVE',
    type: ProtocolType.LENDING,
    description: 'Aave lending protocol on Aptos',
    addresses: [
      '0x34c3e6af238f3a7fa3f3b0088cbc4b194d21f62e65a15b79ae91364de5a81a3a',
      '0x531069f4741cdead39d70b76e5779863864654fae6db8a752a244ff2f9916c15',
      '0x5eb5cc775c5a446db0f3a1c944e11563b97e6a7e1387b9fb459aa26168f738dc',
      '0xc0338eea778de2a5348824ddbfcec033c7f7cbe18da6da40869562906b63c78c',
      '0x12b05c42ac3209a3c6ffadff4ebb6c3e983e5115f26031d56652815b49a14245',
      '0x249676f3faddb83d64fd101baa3f84a171ae02505d796e3edbf4861038a4b5cc',
      '0x39ddcd9e1a39fa14f25e3f9ec8a86074d05cc0881cbf667df8a6ee70942016fb',
    ],
  },
  // Additional DEXs
  LIQUIDSWAP: {
    name: 'LiquidSwap',
    label: 'LiquidSwap',
    type: ProtocolType.DEX,
    description: 'LiquidSwap decentralized exchange',
    addresses: [
      '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12', // v0
      '0x0163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e', // v0.5
      '0x54cb0bb2c18564b86e34539b9f89cfe1186e39d89fce54e1cd007b8e61673a85', // v1
      '0xb247ddeee87e848315caf9a33b8e4c71ac53db888cb88143d62d2370cca0ead2', // v1 Farms
      '0x80273859084bc47f92a6c2d3e9257ebb2349668a1b0fb3db1d759a04c7628855', // router
      '0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8', // pool account v0.5
      '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948', // pool deployer v0
    ],
  },
  CELLANA_FINANCE: {
    name: 'Cellana Finance',
    label: 'CELL',
    type: ProtocolType.DEX,
    description: 'Cellana decentralized exchange',
    addresses: [
      '0x4bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd1',
      '0xea098f1fa9245447c792d18c069433f5da2904358e1e340c55bdc68a8f5fe037',
    ],
  },
  PANORA_EXCHANGE: {
    name: 'Panora Exchange',
    label: 'Panora',
    type: ProtocolType.DEX,
    description: 'Panora decentralized exchange',
    addresses: [
      '0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c',
    ],
  },
  KANA_LABS: {
    name: 'KanaLabs',
    label: 'KANA',
    type: ProtocolType.DEX,
    description: 'KanaLabs DEX and perps',
    addresses: [
      '0x9538c839fe490ccfaf32ad9f7491b5e84e610ff6edc110ff883f06ebde82463d',
      '0x7a38039fffd016adcac2c53795ee49325e5ec6fddf3bf02651c09f9a583655a6',
    ],
  },
  HYPERION: {
    name: 'Hyperion',
    label: 'Hyperion',
    type: ProtocolType.DEX,
    description: 'Hyperion DEX',
    addresses: [
      '0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c',
    ],
  },
  // Bridges
  WORMHOLE: {
    name: 'Wormhole',
    label: 'Wormhole',
    type: ProtocolType.BRIDGE,
    description: 'Wormhole cross-chain bridge',
    addresses: [
      '0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625',
      '0x576410486a2da45eee6c949c995670112ddf2fbeedab20350d506328eefc9d4f',
    ],
  },
  CELER: {
    name: 'Celer Bridge',
    label: 'Celer',
    type: ProtocolType.BRIDGE,
    description: 'Celer cross-chain bridge',
    addresses: [
      '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d',
    ],
  },
  // Other DeFi protocols
  TRUFIN: {
    name: 'TruFin',
    label: 'TruFin',
    type: ProtocolType.LIQUID_STAKING,
    description: 'TruFin liquid staking',
    addresses: [
      '0x6f8ca77dd0a4c65362f475adb1c26ae921b1d75aa6b70e53d0e340efd7d8bc80',
    ],
  },
  UPTOS_PUMP: {
    name: 'Uptos Pump',
    label: 'UPTOS',
    type: ProtocolType.DEX,
    description: 'Uptos meme coin launcher',
    addresses: [
      '0x4e5e85fd647c7e19560590831616a3c021080265576af3182535a1d19e8bc2b3',
    ],
  },
  DEFY: {
    name: 'Defy',
    label: 'DEFY',
    type: ProtocolType.DEX,
    description: 'Defy protocol',
    addresses: [
      '0xcd7b88c2181881bf8e7ef741cae867aee038e75df94224496a4a81627edf7f65',
    ],
  },
  LUCID_FINANCE: {
    name: 'Lucid Finance',
    label: 'Lucid',
    type: ProtocolType.DEX,
    description: 'Lucid Finance protocol',
    addresses: [
      '0xa3111961a31597ca770c60be02fc9f72bdee663f563e45223e79793557eef0d9',
    ],
  },
  PACT_LABS: {
    name: 'Pact Labs',
    label: 'PACT',
    type: ProtocolType.DEX,
    description: 'Pact Labs protocol',
    addresses: [
      '0xddb92cba8f18ae94c40c49ca27a2ba31eca85ce37a436e25d36c8e1f516d9c62',
    ],
  },
  THETIS_MARKET: {
    name: 'Thetis',
    label: 'Thetis',
    type: ProtocolType.DEX,
    description: 'Thetis Market protocol',
    addresses: [
      '0x0c727553dd5019c4887581f0a89dca9c8ea400116d70e9da7164897812c6646e',
    ],
  },
  MIRAGE_PROTOCOL: {
    name: 'Mirage Protocol',
    label: 'Mirage',
    type: ProtocolType.DERIVATIVES,
    description: 'Composable liquidity layer with perpetuals trading',
    addresses: [
      // Add actual contract addresses when available
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ],
  },
  SUSHISWAP: {
    name: 'SushiSwap',
    label: 'SUSHI',
    type: ProtocolType.DEX,
    description: 'SushiSwap decentralized exchange',
    addresses: [
      '0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c',
    ],
  },
  WAPAL: {
    name: 'Wapal',
    label: 'Wapal',
    type: ProtocolType.NFT_MARKETPLACE,
    description: 'Wapal NFT marketplace',
    addresses: [
      '0x584b50b999c78ade62f8359c91b5165ff390338d45f8e55969a04e65d76258c9',
    ],
  },
  MERCATO: {
    name: 'Mercato',
    label: 'Mercato',
    type: ProtocolType.NFT_MARKETPLACE,
    description: 'Mercato NFT marketplace',
    addresses: [
      '0xe11c12ec495f3989c35e1c6a0af414451223305b579291fc8f3d9d0575a23c26',
    ],
  },
  BLUEMOVE_MARKETPLACE: {
    name: 'BlueMove',
    label: 'BlueMove',
    type: ProtocolType.NFT_MARKETPLACE,
    description: 'BlueMove NFT marketplace',
    addresses: [
      '0xd1fd99c1944b84d1670a2536417e997864ad12303d19eac725891691b04d614e',
      '0x51e68edb69491e23b350d1744cc612e837d26d76bf7b3f7cae2f42fab78f1671',
      '0xd520d8669b0a3de23119898dcdff3e0a27910db247663646ad18cf16e44c6f5',
    ],
  },
};

/**
 * Staked/wrapped asset symbols that indicate locked or phantom assets
 */
export const STAKED_ASSET_SYMBOLS = [
  'stAPT', // Generic staked APT
  'thAPT', // Thala staked APT
  'amAPT', // Amnis staked APT
  'sUSDe', // Staked USDe
  'xUSDC', // Wrapped/locked USDC variants
  'zUSDC', // LayerZero USDC
  'zUSDT', // LayerZero USDT
];

/**
 * Asset type regex patterns that indicate locked/phantom assets
 */
export const PHANTOM_ASSET_PATTERNS = [
  // LayerZero assets (often locked in bridge)
  /0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::.*/,
  // Amnis staked assets
  /0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::.*/,
  /0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387::staking::.*/,
  // Thala staked assets
  /0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::.*/,
  // CELL tokens (hidden from portfolio view)
  /0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12::.*/,
  // Generic locked asset patterns
  /.*::locked::.*/i,
  /.*::staked::.*/i,
  /.*::deposit::.*/i,
];

/**
 * Pre-computed arrays for optimized protocol lookups
 * Sorted by address length (longest first) for most specific matches
 */
let PROTOCOL_ADDRESSES_CACHE: Array<{
  address: string;
  protocol: ProtocolInfo;
}> = [];

// Initialize the pre-computed cache
function initializeProtocolCache() {
  if (PROTOCOL_ADDRESSES_CACHE.length === 0) {
    const addressProtocolPairs: Array<{
      address: string;
      protocol: ProtocolInfo;
    }> = [];

    for (const protocol of Object.values(PROTOCOLS)) {
      for (const address of protocol.addresses) {
        addressProtocolPairs.push({ address, protocol });
      }
    }

    // Sort by address length (longest first) for most specific matches
    PROTOCOL_ADDRESSES_CACHE = addressProtocolPairs.sort(
      (a, b) => b.address.length - a.address.length
    );
  }
}

/**
 * Get protocol info by checking if an address contains any protocol addresses
 * Optimized lookup with pre-computed sorted cache - O(k) where k is average addresses per asset (~2-3)
 * Reduced from O(n²) where n was ~30 protocols × 3 addresses = 90 operations per lookup
 */
export function getProtocolByAddress(assetType: string): ProtocolInfo | null {
  // Initialize cache on first use (lazy loading)
  initializeProtocolCache();

  // Iterate through pre-sorted addresses (longest first for specificity)
  for (const { address, protocol } of PROTOCOL_ADDRESSES_CACHE) {
    if (assetType.includes(address)) {
      return protocol;
    }
  }

  return null;
}

/**
 * Check if a protocol should show a badge in the UI
 * Only show badges for assets that are inside DeFi protocol TVL
 */
export function shouldShowProtocolBadge(protocol: ProtocolInfo): boolean {
  // Only show badges for DeFi protocols (liquid staking, lending, farming, dex, derivatives)
  // Don't show badges for bridges or infrastructure as those assets aren't "inside" the protocol TVL
  const defiProtocolTypes = [
    ProtocolType.LIQUID_STAKING,
    ProtocolType.LENDING,
    ProtocolType.FARMING,
    ProtocolType.DEX,
    ProtocolType.DERIVATIVES,
  ];

  return defiProtocolTypes.includes(protocol.type);
}

/**
 * Get protocol label for UI display
 */
export function getProtocolLabel(assetType: string): string | null {
  const protocol = getProtocolByAddress(assetType);

  if (protocol) {
    // Special handling for LayerZero bridge assets
    if (protocol.label === 'LayerZero') {
      if (assetType.includes('USDC')) return 'zUSDC';
      if (assetType.includes('USDT')) return 'zUSDT';
      if (assetType.includes('WETH')) return 'zWETH';
      if (assetType.includes('WBTC')) return 'zWBTC';
    }

    return protocol.label;
  }

  return null;
}

/**
 * Check if an asset is a phantom/locked asset
 */
export function isPhantomAsset(assetType: string, metadata?: any): boolean {
  // Check regex patterns
  if (PHANTOM_ASSET_PATTERNS.some(pattern => pattern.test(assetType))) {
    return true;
  }

  // Check if asset belongs to a protocol that typically locks assets
  const protocol = getProtocolByAddress(assetType);
  if (protocol) {
    // Bridge tokens (USDC, USDT, WETH, WBTC) are NOT phantom assets - they're tradeable
    if (protocol.type === ProtocolType.BRIDGE) {
      // Check if it's a standard bridged token (these are tradeable)
      const tradableBridgedTokens = [
        'USDC',
        'USDT',
        'WETH',
        'WBTC',
        'ETH',
        'BTC',
      ];
      if (
        metadata?.symbol &&
        tradableBridgedTokens.some(token =>
          metadata.symbol.toUpperCase().includes(token)
        )
      ) {
        return false; // These are tradeable bridged tokens, not phantom assets
      }
      // Only consider non-standard bridge assets as phantom
      return true;
    }

    // Liquid staking and farming assets are typically locked
    if (
      [ProtocolType.LIQUID_STAKING, ProtocolType.FARMING].includes(
        protocol.type
      )
    ) {
      return true;
    }
  }

  // Check symbol-based detection
  if (
    metadata?.symbol &&
    STAKED_ASSET_SYMBOLS.some(stakedSymbol =>
      metadata.symbol.toLowerCase().includes(stakedSymbol.toLowerCase())
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Get a human-readable reason why an asset is considered phantom/locked
 */
export function getPhantomReason(assetType: string): string {
  const protocol = getProtocolByAddress(assetType);

  if (protocol) {
    switch (protocol.type) {
      case ProtocolType.LIQUID_STAKING:
        return `Staked in ${protocol.name}`;
      case ProtocolType.BRIDGE:
        return `Locked in ${protocol.name} bridge`;
      case ProtocolType.FARMING:
        return `Deposited in ${protocol.name} farm`;
      case ProtocolType.LENDING:
        return `Collateral in ${protocol.name}`;
      default:
        return `Locked in ${protocol.name}`;
    }
  }

  // Check patterns for generic reasons
  if (assetType.match(/.*::locked::.*/i)) {
    return 'Locked in protocol contract';
  }
  if (assetType.match(/.*::staked::.*/i)) {
    return 'Staked in protocol';
  }
  if (assetType.match(/.*::deposit::.*/i)) {
    return 'Deposited in protocol';
  }

  return 'Potentially locked in DeFi protocol';
}

/**
 * Get all protocols by type
 */
export function getProtocolsByType(type: ProtocolType): ProtocolInfo[] {
  return Object.values(PROTOCOLS).filter(protocol => protocol.type === type);
}

/**
 * Get all protocol addresses as a flat array
 */
export function getAllProtocolAddresses(): string[] {
  return Object.values(PROTOCOLS).flatMap(protocol => protocol.addresses);
}
