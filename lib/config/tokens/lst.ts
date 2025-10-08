import type { TokenMetadata } from "@/lib/types/tokens";

// Utility functions
const generateAccountLink = (address: string) =>
  `https://explorer.aptoslabs.com/account/${address}?network=mainnet`;

const generateExplorerLink = (address: string) =>
  `https://explorer.aptoslabs.com/fungible_asset/${address}?network=mainnet`;

// Base token configuration interface
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
    website: "https://www.thala.fi",
    auditLink: "https://www.thala.fi/docs/security",
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
    website: "https://www.thala.fi",
    auditLink: "https://www.thala.fi/docs/security",
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
    auditLink: "https://docs.amnis.finance/security-audits",
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
    auditLink: "https://docs.amnis.finance/security-audits",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  kAPT: {
    name: "Kofi APT",
    symbol: "kAPT",
    thumbnail: "/icons/lst/kofi-kAPT.png",
    type: "Liquid Staking Token",
    issuer: "Kofi Finance",
    assetAddress: "0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105",
    decimals: 8,
    website: "https://kofi.finance",
    auditLink: "https://docs.kofi.finance",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  stkAPT: {
    name: "Kofi Staked APT",
    symbol: "stkAPT",
    thumbnail: "/icons/lst/kofi-stkAPT.png",
    type: "Liquid Staking Token",
    issuer: "Kofi Finance",
    assetAddress: "0x42556039b88593e768c97ab1a3ab0c6a17230825769304482dff8fdebe4c002b",
    decimals: 8,
    website: "https://kofi.finance",
    auditLink: "https://docs.kofi.finance",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
  truAPT: {
    name: "TruFin truAPT",
    symbol: "truAPT",
    thumbnail: "/icons/lst/TruAPT.png",
    type: "Liquid Staking Token",
    issuer: "TruFin",
    assetAddress: "0xaef6a8c3182e076db72d64324617114cacf9a52f28325edc10b483f7f05da0e7",
    decimals: 8,
    website: "https://www.trufin.io",
    auditLink: "https://www.trufin.io",
    tags: ["liquid-staking", "delegated"],
    isAccount: true,
  },
};

// Generate metadata objects
const generateMetadata = (config: BaseTokenConfig): TokenMetadata => ({
  ...config,
  explorerLink: config.isAccount
    ? generateAccountLink(config.assetAddress.split("::")[0])
    : generateExplorerLink(config.assetAddress),
});

export const LST_METADATA: Record<string, TokenMetadata> = Object.fromEntries(
  Object.entries(LST_CONFIGS).map(([key, config]) => [key, generateMetadata(config)])
);

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
    name: tokens.map((token) => LST_CONFIGS[token].name.split(" ").slice(-1)[0]).join(" / "),
    symbol: key,
  };
});

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
    asset_type: "0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62",
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
    asset_type: "0xa0d9d647c5737a5aed08d2cfeb39c31cf901d44bc4aa024eaa7e5e68b804e011",
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
    asset_type: "0x0a9ce1bddf93b074697ec5e483bc5050bc64cff2acd31e1ccfd8ac8cae5e4abe",
  },
  // Kofi - kAPT (FA only)
  {
    symbol: "kAPT",
    name: LST_CONFIGS.kAPT.name,
    decimals: LST_CONFIGS.kAPT.decimals,
    asset_type: "0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105",
  },
  // Kofi - stkAPT (FA only)
  {
    symbol: "stkAPT",
    name: LST_CONFIGS.stkAPT.name,
    decimals: LST_CONFIGS.stkAPT.decimals,
    asset_type: "0x42556039b88593e768c97ab1a3ab0c6a17230825769304482dff8fdebe4c002b",
  },
  // TruFin - truAPT (FA only)
  {
    symbol: "truAPT",
    name: "TruFin truAPT",
    decimals: 8,
    asset_type: "0xaef6a8c3182e076db72d64324617114cacf9a52f28325edc10b483f7f05da0e7",
  },
];

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
    asset_type: "0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105::coin::T",
    description: LST_CONFIGS.kAPT.name,
    decimals: LST_CONFIGS.kAPT.decimals,
  },
  stkAPT: {
    asset_type: "0x42556039b88593e768c97ab1a3ab0c6a17230825769304482dff8fdebe4c002b::coin::T",
    description: LST_CONFIGS.stkAPT.name,
    decimals: LST_CONFIGS.stkAPT.decimals,
  },
} as const;
