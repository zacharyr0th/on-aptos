import { TokenMetadata } from "@/components/pages/stables/Dialog";

// Common token interface definitions
export interface Token {
  symbol: string;
  supply: string;
  supply_raw?: string;
  formatted_supply?: string;
}

export interface CombinedToken {
  symbol: string;
  supply: string;
  supply_raw?: string;
  isCombined: true;
  components: Token[];
}

export type DisplayToken = Token | CombinedToken;

export interface SupplyData {
  supplies: Token[];
  total: string;
  total_formatted?: string;
  timestamp?: string;
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
const generateExplorerLink = (address: string) =>
  `https://explorer.aptoslabs.com/fungible_asset/${address}?network=mainnet`;

const generateAccountLink = (address: string) =>
  `https://explorer.aptoslabs.com/account/${address}?network=mainnet`;

// ==========================================================================
// SHARED CONSTANTS
// ==========================================================================

// Tether reserve address that should be subtracted from total supply
export const TETHER_RESERVE_ADDRESS =
  "0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9";

// ==========================================================================
// BASE TOKEN CONFIGURATIONS
// ==========================================================================
interface BaseTokenConfig {
  name: string;
  symbol: string;
  thumbnail: string;
  type: string;
  issuer: string;
  assetAddress: string;
  decimals: number;
  website: string;
  auditLink: string;
  tags: string[];
  isAccount?: boolean; // For LST tokens that use account links
}

const STABLECOIN_CONFIGS: Record<string, BaseTokenConfig> = {
  // Native fungible assets
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    thumbnail: "/icons/stables/usdt.png",
    type: "Native Aptos issuance",
    issuer: "Tether Operations Ltd.",
    assetAddress:
      "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
    decimals: 6,
    website: "https://tether.to",
    auditLink:
      "https://tether.to/en/supported-protocols/?utm_source=chatgpt.com",
    tags: ["collateralized", "fiat-backed"],
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    thumbnail: "/icons/stables/usdc.png",
    type: "Native Aptos issuance (Circle CCTP)",
    issuer: "Circle Internet Financial LLC",
    assetAddress:
      "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
    decimals: 6,
    website: "https://www.circle.com/usdc",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["collateralized", "fiat-backed"],
  },
  USDA: {
    name: "USD Aptos",
    symbol: "USDA",
    thumbnail: "/icons/stables/USDA.png",
    type: "Native Aptos issuance",
    issuer: "USDA Issuer",
    assetAddress:
      "0x534e4c3dc0f038dab1a8259e89301c4da58779a5d482fb354a41c08147e6b9ec",
    decimals: 8,
    website: "#",
    auditLink: "#",
    tags: ["collateralized", "fiat-backed"],
  },
  MOD: {
    name: "MOD",
    symbol: "MOD",
    thumbnail: "/icons/stables/mod.png",
    type: "Algorithmic Stablecoin",
    issuer: "Thala",
    assetAddress:
      "0x94ed76d3d66cb0b6e7a3ab81acf830e3a50b8ae3cfb9edc0abea635a11185ff4",
    decimals: 8,
    website: "#",
    auditLink: "#",
    tags: ["algorithmic", "synthetic"],
  },
  mUSD: {
    name: "Mirage USD",
    symbol: "mUSD",
    thumbnail: "/icons/stables/mUSD.svg",
    type: "Algorithmic Stablecoin",
    issuer: "Mirage",
    assetAddress:
      "0xdd84125d1ebac8f1ecb2819801417fc392325e672be111ec03830c34d6ff82dd",
    decimals: 8,
    website: "https://mirage.money",
    auditLink: "#",
    tags: ["algorithmic", "synthetic", "collateralized"],
  },
  sUSDe: {
    name: "Ethena sUSDe",
    symbol: "sUSDe",
    thumbnail: "/icons/stables/susde.png",
    type: "Algorithmic Stablecoin (LayerZero OFT)",
    issuer: "Ethena Labs",
    assetAddress:
      "0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69",
    decimals: 6,
    website: "https://ethena.fi",
    auditLink: "https://www.ethena.fi/transparency",
    tags: ["algorithmic", "delta-hedged", "synthetic"],
  },
  USDe: {
    name: "Ethena USDe",
    symbol: "USDe",
    thumbnail: "/icons/stables/usde.png",
    type: "Algorithmic Stablecoin (LayerZero OFT)",
    issuer: "Ethena Labs",
    assetAddress:
      "0xf37a8864fe737eb8ec2c2931047047cbaed1beed3fb0e5b7c5526dafd3b9c2e9",
    decimals: 6,
    website: "https://ethena.fi",
    auditLink: "https://www.ethena.fi/transparency",
    tags: ["algorithmic", "delta-hedged", "synthetic"],
  },
  // LayerZero bridged
  lzUSDC: {
    name: "LayerZero USDC",
    symbol: "lzUSDC",
    thumbnail: "/icons/stables/usdc.png",
    type: "Bridged via LayerZero",
    issuer: "Circle (via LayerZero)",
    assetAddress:
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    decimals: 6,
    website: "https://layerzero.network",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["bridged", "layerzero"],
  },
  lzUSDT: {
    name: "LayerZero USDT",
    symbol: "lzUSDT",
    thumbnail: "/icons/stables/usdt.png",
    type: "Bridged via LayerZero",
    issuer: "Tether (via LayerZero)",
    assetAddress:
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    decimals: 6,
    website: "https://layerzero.network",
    auditLink: "https://tether.to/en/transparency",
    tags: ["bridged", "layerzero"],
  },
  // Wormhole bridged
  whUSDC: {
    name: "Wormhole USDC",
    symbol: "whUSDC",
    thumbnail: "/icons/stables/usdc.png",
    type: "Bridged via Wormhole",
    issuer: "Circle (via Wormhole)",
    assetAddress:
      "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T",
    decimals: 6,
    website: "https://wormhole.com",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["bridged", "wormhole"],
  },
  whUSDT: {
    name: "Wormhole USDT",
    symbol: "whUSDT",
    thumbnail: "/icons/stables/usdt.png",
    type: "Bridged via Wormhole",
    issuer: "Tether (via Wormhole)",
    assetAddress:
      "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T",
    decimals: 6,
    website: "https://wormhole.com",
    auditLink: "https://tether.to/en/transparency",
    tags: ["bridged", "wormhole"],
  },
  // Celer bridged
  ceUSDC: {
    name: "Celer USDC",
    symbol: "ceUSDC",
    thumbnail: "/icons/stables/usdc.png",
    type: "Bridged via Celer",
    issuer: "Circle (via Celer)",
    assetAddress:
      "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdcCoin",
    decimals: 6,
    website: "https://celer.network",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["bridged", "celer"],
  },
  ceUSDT: {
    name: "Celer USDT",
    symbol: "ceUSDT",
    thumbnail: "/icons/stables/usdt.png",
    type: "Bridged via Celer",
    issuer: "Tether (via Celer)",
    assetAddress:
      "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdtCoin",
    decimals: 6,
    website: "https://celer.network",
    auditLink: "https://tether.to/en/transparency",
    tags: ["bridged", "celer"],
  },
};

const BTC_CONFIGS: Record<string, BaseTokenConfig> = {
  xBTC: {
    name: "OKX wBTC",
    symbol: "xBTC",
    thumbnail: "/icons/btc/okx.png",
    type: "Bridged via OKX Bridge",
    issuer: "OKX",
    assetAddress:
      "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387",
    decimals: 8,
    website: "https://www.okx.com",
    auditLink: "https://www.okx.com/proof-of-reserves",
    tags: ["wrapped", "centralized"],
  },
  SBTC: {
    name: "StakeStone Bitcoin",
    symbol: "SBTC",
    thumbnail: "/icons/btc/stakestone.png",
    type: "Bridged via LayerZero",
    issuer: "StakeStone",
    assetAddress:
      "0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin",
    decimals: 8,
    website: "https://stakestone.io",
    auditLink: "https://stakestone.io",
    tags: ["wrapped", "decentralized"],
  },
  aBTC: {
    name: "Aptos Bitcoin",
    symbol: "aBTC",
    thumbnail: "/icons/btc/echo.png",
    type: "Bridged via Echo",
    issuer: "Echo Protocol",
    assetAddress:
      "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC",
    decimals: 10,
    website: "https://aptoslabs.com",
    auditLink: "https://aptoslabs.com",
    tags: ["wrapped", "decentralized"],
  },
  WBTC: {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    thumbnail: "/icons/btc/WBTC.png",
    type: "Bridged via LayerZero OFT",
    issuer: "BitGo",
    assetAddress:
      "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d",
    decimals: 8,
    website: "https://wbtc.network",
    auditLink: "https://www.bitgo.com/resources/learn/wbtc-audit",
    tags: ["wrapped", "layerzero"],
  },
};

const LST_CONFIGS: Record<string, BaseTokenConfig> = {
  thAPT: {
    name: "Thala APT",
    symbol: "thAPT",
    thumbnail: "/icons/lst/thala-thAPT.png",
    type: "Liquid Staking Token",
    issuer: "Thala Labs",
    assetAddress:
      "0xeeaf784001c27596b7af5d89627191e510abcf8db21cd3ab9baba746f389d4a0::apt_stake::StakedAptos",
    decimals: 8,
    website: "https://thala.fi",
    auditLink: "https://thala.fi/docs/security",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  sthAPT: {
    name: "Thala Staked APT",
    symbol: "sthAPT",
    thumbnail: "/icons/lst/sthAPT.png",
    type: "Liquid Staking Token",
    issuer: "Thala Labs",
    assetAddress:
      "0xeeaf784001c27596b7af5d89627191e510abcf8db21cd3ab9baba746f389d4a0::apt_stake::StakedAptos",
    decimals: 8,
    website: "https://thala.fi",
    auditLink: "https://thala.fi/docs/security",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  amAPT: {
    name: "Amnis APT",
    symbol: "amAPT",
    thumbnail: "/icons/lst/amnis-amAPT.png",
    type: "Liquid Staking Token",
    issuer: "Amnis Finance",
    assetAddress:
      "0xe9c192ff55cffab3963c695cff6dbf9dad6aff2bb5ac19a6415cad26a81860d9::minted_apt::MAptosAsset",
    decimals: 8,
    website: "https://amnis.finance",
    auditLink: "https://docs.amnis.finance/amnis-docs/security-and-risks",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  stAPT: {
    name: "Amnis Staked APT",
    symbol: "stAPT",
    thumbnail: "/icons/lst/amnis-stAPT.jpeg",
    type: "Liquid Staking Token",
    issuer: "Amnis Finance",
    assetAddress:
      "0xe9c192ff55cffab3963c695cff6dbf9dad6aff2bb5ac19a6415cad26a81860d9::staked_apt::StakedAptosAsset",
    decimals: 8,
    website: "https://amnis.finance",
    auditLink: "https://docs.amnis.finance/amnis-docs/security-and-risks",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  kAPT: {
    name: "Kofi APT",
    symbol: "kAPT",
    thumbnail: "/icons/lst/kofi-kAPT.png",
    type: "Liquid Staking Token",
    issuer: "Kofi Finance",
    assetAddress:
      "0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105",
    decimals: 8,
    website: "https://kofi.finance",
    auditLink: "https://docs.kofi.finance/protocol/security",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  stkAPT: {
    name: "Kofi Staked APT",
    symbol: "stkAPT",
    thumbnail: "/icons/lst/kofi-stkAPT.png",
    type: "Liquid Staking Token",
    issuer: "Kofi Finance",
    assetAddress:
      "0x42556039b88593e768c97ab1a3ab0c6a17230825769304482dff8fdebe4c002b",
    decimals: 8,
    website: "https://kofi.finance",
    auditLink: "https://docs.kofi.finance/protocol/security",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  truAPT: {
    name: "TruFin truAPT",
    symbol: "truAPT",
    thumbnail: "/icons/lst/TruAPT.png",
    type: "Liquid Staking Token",
    issuer: "TruFin",
    assetAddress:
      "0xaef6a8c3182e076db72d64324617114cacf9a52f28325edc10b483f7f05da0e7",
    decimals: 8,
    website: "https://trufin.io",
    auditLink: "https://trufin.io/security",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
};

// ==========================================================================
// GENERATE METADATA OBJECTS
// ==========================================================================
const generateMetadata = (config: BaseTokenConfig): TokenMetadata => ({
  ...config,
  explorerLink: config.isAccount
    ? generateAccountLink(config.assetAddress.split("::")[0])
    : generateExplorerLink(config.assetAddress),
});

// Export metadata objects
export const STABLECOIN_METADATA: Record<string, TokenMetadata> =
  Object.fromEntries(
    Object.entries(STABLECOIN_CONFIGS).map(([key, config]) => [
      key,
      generateMetadata(config),
    ]),
  );

export const BTC_METADATA: Record<string, TokenMetadata> = Object.fromEntries(
  Object.entries(BTC_CONFIGS).map(([key, config]) => [
    key,
    generateMetadata(config),
  ]),
);

export const LST_METADATA: Record<string, TokenMetadata> = Object.fromEntries(
  Object.entries(LST_CONFIGS).map(([key, config]) => [
    key,
    generateMetadata(config),
  ]),
);

// Add combined tokens
STABLECOIN_METADATA["sUSDe / USDe"] = {
  name: "Ethena sUSDe / USDe",
  symbol: "sUSDe / USDe",
  thumbnail: "/icons/stables/usde.png",
  type: "Bridged via LayerZero OFT",
  issuer: "Ethena Labs",
  assetAddress: `${STABLECOIN_CONFIGS.sUSDe.assetAddress}\n${STABLECOIN_CONFIGS.USDe.assetAddress}`,
  decimals: 6,
  explorerLink: `${generateExplorerLink(STABLECOIN_CONFIGS.sUSDe.assetAddress)}\n${generateExplorerLink(STABLECOIN_CONFIGS.USDe.assetAddress)}`,
  website: "https://ethena.fi",
  auditLink: "https://www.ethena.fi/transparency",
  tags: ["algorithmic", "delta-hedged", "synthetic"],
};

// Add LST combined tokens
const lstCombined = [
  { key: "thAPT/sthAPT", tokens: ["thAPT", "sthAPT"], base: "thAPT" },
  { key: "amAPT/stAPT", tokens: ["amAPT", "stAPT"], base: "amAPT" },
  { key: "kAPT/stkAPT", tokens: ["kAPT", "stkAPT"], base: "kAPT" },
];

lstCombined.forEach(({ key, tokens, base }) => {
  const baseConfig = LST_CONFIGS[base];
  LST_METADATA[key] = {
    ...generateMetadata(baseConfig),
    name: tokens
      .map((token) => LST_CONFIGS[token].name.split(" ").slice(-1)[0])
      .join(" / "),
    symbol: key,
  };
});

// ==========================================================================
// ECHO PROTOCOL CONFIGURATION
// ==========================================================================
export const ECHO_PROTOCOL_CONFIG = {
  protocol: "Echo",
  enabled: true,
  markets: [
    {
      symbol: "aBTC",
      marketAddress:
        "0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7",
      assetType: BTC_CONFIGS.aBTC.assetAddress,
      description: BTC_CONFIGS.aBTC.name,
      decimals: BTC_CONFIGS.aBTC.decimals,
      apyBase: 0.0,
      apyReward: 0.04,
      apyBaseBorrow: 0.0,
      totalBorrow: 0,
      totalBorrowUsd: 0,
    },
  ],
};

// ==========================================================================
// ROUTER CONFIGURATIONS
// ==========================================================================
export const BTC_ASSETS = Object.entries(BTC_CONFIGS).map(
  ([symbol, config]) => ({
    symbol,
    assetAddress: config.assetAddress,
    description: config.name,
  }),
);

export const BTC_TOKENS = Object.fromEntries(
  Object.entries(BTC_CONFIGS).map(([symbol, config]) => [
    symbol,
    {
      asset_type: config.assetAddress,
      description: config.name,
      decimals: config.decimals,
    },
  ]),
);

export const LST_TOKENS = [
  // Amnis - amAPT
  {
    symbol: "amAPT",
    name: LST_CONFIGS.amAPT.name,
    decimals: LST_CONFIGS.amAPT.decimals,
    asset_type:
      "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
  },
  {
    symbol: "amAPT-FA",
    name: `${LST_CONFIGS.amAPT.name} (FA)`,
    decimals: LST_CONFIGS.amAPT.decimals,
    asset_type:
      "0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62",
  },
  // Amnis - stAPT
  {
    symbol: "stAPT",
    name: LST_CONFIGS.stAPT.name,
    decimals: LST_CONFIGS.stAPT.decimals,
    asset_type:
      "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt",
  },
  {
    symbol: "stAPT-FA",
    name: `${LST_CONFIGS.stAPT.name} (FA)`,
    decimals: LST_CONFIGS.stAPT.decimals,
    asset_type:
      "0xe9c192ff55cffab3963c695cff6dbf9dad6aff2bb5ac19a6415cad26a81860d9::staked_apt::StakedAptosAsset",
  },
  // Thala - thAPT
  {
    symbol: "thAPT",
    name: LST_CONFIGS.thAPT.name,
    decimals: LST_CONFIGS.thAPT.decimals,
    asset_type:
      "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
  },
  {
    symbol: "thAPT-FA",
    name: `${LST_CONFIGS.thAPT.name} (FA)`,
    decimals: LST_CONFIGS.thAPT.decimals,
    asset_type:
      "0xa0d9d647c5737a5aed08d2cfeb39c31cf901d44bc4aa024eaa7e5e68b804e011",
  },
  // Thala - sthAPT
  {
    symbol: "sthAPT",
    name: LST_CONFIGS.sthAPT.name,
    decimals: LST_CONFIGS.sthAPT.decimals,
    asset_type:
      "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::StakedThalaAPT",
  },
  {
    symbol: "sthAPT-FA",
    name: `${LST_CONFIGS.sthAPT.name} (FA)`,
    decimals: LST_CONFIGS.sthAPT.decimals,
    asset_type:
      "0x0a9ce1bddf93b074697ec5e483bc5050bc64cff2acd31e1ccfd8ac8cae5e4abe",
  },
  // Kofi - kAPT (FA only)
  {
    symbol: "kAPT",
    name: LST_CONFIGS.kAPT.name,
    decimals: LST_CONFIGS.kAPT.decimals,
    asset_type:
      "0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105",
  },
  // Kofi - stkAPT (FA only)
  {
    symbol: "stkAPT",
    name: LST_CONFIGS.stkAPT.name,
    decimals: LST_CONFIGS.stkAPT.decimals,
    asset_type:
      "0x42556039b88593e768c97ab1a3ab0c6a17230825769304482dff8fdebe4c002b",
  },
  // TruFin - truAPT (FA only)
  {
    symbol: "truAPT",
    name: "TruFin truAPT",
    decimals: 8,
    asset_type:
      "0xaef6a8c3182e076db72d64324617114cacf9a52f28325edc10b483f7f05da0e7",
  },
];

export const STABLE_TOKENS: Record<string, string> = Object.fromEntries(
  Object.entries(STABLECOIN_CONFIGS).map(([symbol, config]) => [
    symbol,
    config.assetAddress,
  ]),
);

export const PANORA_TOKENS = {
  amAPT: {
    asset_type:
      "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
    description: LST_CONFIGS.amAPT.name,
    decimals: LST_CONFIGS.amAPT.decimals,
  },
  stAPT: {
    asset_type:
      "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt",
    description: LST_CONFIGS.stAPT.name,
    decimals: LST_CONFIGS.stAPT.decimals,
  },
  thAPT: {
    asset_type:
      "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
    description: LST_CONFIGS.thAPT.name,
    decimals: LST_CONFIGS.thAPT.decimals,
  },
  sthAPT: {
    asset_type:
      "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::StakedThalaAPT",
    description: LST_CONFIGS.sthAPT.name,
    decimals: LST_CONFIGS.sthAPT.decimals,
  },
  kAPT: {
    asset_type:
      "0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105::coin::T",
    description: LST_CONFIGS.kAPT.name,
    decimals: LST_CONFIGS.kAPT.decimals,
  },
  stkAPT: {
    asset_type:
      "0x42556039b88593e768c97ab1a3ab0c6a17230825769304482dff8fdebe4c002b::coin::T",
    description: LST_CONFIGS.stkAPT.name,
    decimals: LST_CONFIGS.stkAPT.decimals,
  },
} as const;

// Protocol configuration
export const PROTOCOL_ICONS = {
  echelon: "/icons/protocols/echelon.avif",
  echo: "/icons/btc/echo.png",
  default: "/icons/btc/bitcoin.png",
} as const;
