import type { TokenMetadata } from "@/lib/types/tokens";

// Utility functions
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
}

const BTC_CONFIGS: Record<string, BaseTokenConfig> = {
  xBTC: {
    name: "OKX wBTC",
    symbol: "xBTC",
    thumbnail: "/icons/btc/okx.webp",
    type: "Bridged via OKX Bridge",
    issuer: "OKX",
    assetAddress: "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387",
    decimals: 8,
    website: "https://www.okx.com",
    auditLink: "https://www.okx.com/proof-of-reserves",
    tags: ["wrapped", "centralized"],
  },
  SBTC: {
    name: "StakeStone Bitcoin",
    symbol: "SBTC",
    thumbnail: "/icons/btc/stakestone.webp",
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
    thumbnail: "/icons/btc/echo.webp",
    type: "Bridged via Echo",
    issuer: "Echo Protocol",
    assetAddress: "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC",
    decimals: 10,
    website: "https://aptoslabs.com",
    auditLink: "https://aptoslabs.com",
    tags: ["wrapped", "decentralized"],
  },
  WBTC: {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    thumbnail: "/icons/btc/WBTC.webp",
    type: "Bridged via LayerZero OFT",
    issuer: "BitGo",
    assetAddress: "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d",
    decimals: 8,
    website: "https://wbtc.network",
    auditLink: "https://wbtc.network/dashboard/audit",
    tags: ["wrapped", "layerzero"],
  },
  FiaBTC: {
    name: "Fiamma Bitcoin",
    symbol: "FiaBTC",
    thumbnail: "/icons/btc/fiatbtc.webp",
    type: "Bridged Bitcoin",
    issuer: "Fiamma",
    assetAddress: "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
    decimals: 8,
    website: "https://www.fiammalabs.io",
    auditLink: "https://www.openzeppelin.com/news/fiamma-bridge-audit",
    tags: ["wrapped", "bridged"],
  },
};

// Generate metadata objects
const generateMetadata = (config: BaseTokenConfig): TokenMetadata => ({
  ...config,
  explorerLink: generateExplorerLink(config.assetAddress),
});

export const BTC_METADATA: Record<string, TokenMetadata> = Object.fromEntries(
  Object.entries(BTC_CONFIGS).map(([key, config]) => [key, generateMetadata(config)])
);

// Router configurations
export const BTC_ASSETS = Object.entries(BTC_CONFIGS).map(([symbol, config]) => ({
  symbol,
  assetAddress: config.assetAddress,
  description: config.name,
}));

export const BTC_TOKENS = Object.fromEntries(
  Object.entries(BTC_CONFIGS).map(([symbol, config]) => [
    symbol,
    {
      asset_type: config.assetAddress,
      description: config.name,
      decimals: config.decimals,
    },
  ])
);
