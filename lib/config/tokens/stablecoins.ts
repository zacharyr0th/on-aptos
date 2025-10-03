import type { TokenMetadata } from "@/lib/types/tokens";

// Utility functions
const generateExplorerLink = (address: string) =>
  `https://explorer.aptoslabs.com/fungible_asset/${address}?network=mainnet`;

// Tether reserve address that should be subtracted from total supply
export const TETHER_RESERVE_ADDRESS =
  "0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9";

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

const STABLECOIN_CONFIGS: Record<string, BaseTokenConfig> = {
  // Native fungible assets
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    thumbnail: "/icons/stables/usdt.webp",
    type: "Native Aptos issuance",
    issuer: "Tether Operations Ltd.",
    assetAddress: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
    decimals: 6,
    website: "https://tether.to",
    auditLink: "https://tether.to/en/supported-protocols/?utm_source=chatgpt.com",
    tags: ["collateralized", "fiat-backed"],
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    thumbnail: "/icons/stables/usdc.webp",
    type: "Native Aptos issuance (Circle CCTP)",
    issuer: "Circle Internet Financial LLC",
    assetAddress: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
    decimals: 6,
    website: "https://www.circle.com/usdc",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["collateralized", "fiat-backed"],
  },
  USDA: {
    name: "USD Aptos",
    symbol: "USDA",
    thumbnail: "/icons/stables/USDA.webp",
    type: "Native Aptos issuance",
    issuer: "USDA Issuer",
    assetAddress: "0x534e4c3dc0f038dab1a8259e89301c4da58779a5d482fb354a41c08147e6b9ec",
    decimals: 8,
    website: "#",
    auditLink: "#",
    tags: ["collateralized", "fiat-backed"],
  },
  MOD: {
    name: "MOD",
    symbol: "MOD",
    thumbnail: "/icons/stables/mod.webp",
    type: "Algorithmic Stablecoin",
    issuer: "Thala",
    assetAddress: "0x94ed76d3d66cb0b6e7a3ab81acf830e3a50b8ae3cfb9edc0abea635a11185ff4",
    decimals: 8,
    website: "#",
    auditLink: "#",
    tags: ["algorithmic", "synthetic"],
  },
  sUSDe: {
    name: "Ethena sUSDe",
    symbol: "sUSDe",
    thumbnail: "/icons/stables/susde.webp",
    type: "Algorithmic Stablecoin (LayerZero OFT)",
    issuer: "Ethena Labs",
    assetAddress: "0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69",
    decimals: 6,
    website: "https://ethena.fi",
    auditLink: "https://www.ethena.fi/transparency",
    tags: ["algorithmic", "delta-hedged", "synthetic"],
  },
  USDe: {
    name: "Ethena USDe",
    symbol: "USDe",
    thumbnail: "/icons/stables/usde.webp",
    type: "Algorithmic Stablecoin (LayerZero OFT)",
    issuer: "Ethena Labs",
    assetAddress: "0xf37a8864fe737eb8ec2c2931047047cbaed1beed3fb0e5b7c5526dafd3b9c2e9",
    decimals: 6,
    website: "https://ethena.fi",
    auditLink: "https://www.ethena.fi/transparency",
    tags: ["algorithmic", "delta-hedged", "synthetic"],
  },
  USD1: {
    name: "World Liberty Financial USD",
    symbol: "USD1",
    thumbnail: "https://assets.panora.exchange/tokens/aptos/USD1.png",
    type: "Native Aptos issuance",
    issuer: "World Liberty Financial",
    assetAddress: "0x05fabd1b12e39967a3c24e91b7b8f67719a6dacee74f3c8b9fb7d93e855437d2",
    decimals: 6,
    website: "https://worldlibertyfinancial.com",
    auditLink: "#",
    tags: ["collateralized", "fiat-backed"],
  },
  // LayerZero bridged
  lzUSDC: {
    name: "LayerZero USDC",
    symbol: "lzUSDC",
    thumbnail: "/icons/stables/usdc.webp",
    type: "Bridged via LayerZero",
    issuer: "Circle (via LayerZero)",
    assetAddress: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    decimals: 6,
    website: "https://layerzero.network",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["bridged", "layerzero"],
  },
  // Multichain bridged
  multiUSDC: {
    name: "Multichain USDC",
    symbol: "multiUSDC",
    thumbnail: "/icons/stables/usdc.webp",
    type: "Bridged via Multichain",
    issuer: "Circle (via Multichain)",
    assetAddress: "0xd6d6372c8bde72a7ab825c00b9edd35e643fb94a61c55d9d94a9db3010098548::USDC::Coin",
    decimals: 6,
    website: "https://multichain.org",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["bridged", "multichain"],
  },
  lzUSDT: {
    name: "LayerZero USDT",
    symbol: "lzUSDT",
    thumbnail: "/icons/stables/usdt.webp",
    type: "Bridged via LayerZero",
    issuer: "Tether (via LayerZero)",
    assetAddress: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    decimals: 6,
    website: "https://layerzero.network",
    auditLink: "https://tether.to/en/transparency",
    tags: ["bridged", "layerzero"],
  },
  // Wormhole bridged
  whUSDC: {
    name: "Wormhole USDC",
    symbol: "whUSDC",
    thumbnail: "/icons/stables/usdc.webp",
    type: "Bridged via Wormhole",
    issuer: "Circle (via Wormhole)",
    assetAddress: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T",
    decimals: 6,
    website: "https://wormhole.com",
    auditLink: "https://www.circle.com/en/transparency",
    tags: ["bridged", "wormhole"],
  },
  whUSDT: {
    name: "Wormhole USDT",
    symbol: "whUSDT",
    thumbnail: "/icons/stables/usdt.webp",
    type: "Bridged via Wormhole",
    issuer: "Tether (via Wormhole)",
    assetAddress: "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T",
    decimals: 6,
    website: "https://wormhole.com",
    auditLink: "https://tether.to/en/transparency",
    tags: ["bridged", "wormhole"],
  },
  // Celer bridged
  ceUSDC: {
    name: "Celer USDC",
    symbol: "ceUSDC",
    thumbnail: "/icons/stables/usdc.webp",
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
    thumbnail: "/icons/stables/usdt.webp",
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

// Generate metadata objects
const generateMetadata = (config: BaseTokenConfig): TokenMetadata => ({
  ...config,
  explorerLink: generateExplorerLink(config.assetAddress),
});

export const STABLECOIN_METADATA: Record<string, TokenMetadata> = Object.fromEntries(
  Object.entries(STABLECOIN_CONFIGS).map(([key, config]) => [key, generateMetadata(config)])
);

// Add combined tokens
STABLECOIN_METADATA["sUSDe / USDe"] = {
  name: "Ethena sUSDe / USDe",
  symbol: "sUSDe / USDe",
  thumbnail: "/icons/stables/usde.webp",
  type: "Bridged via LayerZero OFT",
  issuer: "Ethena Labs",
  assetAddress: `${STABLECOIN_CONFIGS.sUSDe.assetAddress}\n${STABLECOIN_CONFIGS.USDe.assetAddress}`,
  decimals: 6,
  explorerLink: `${generateExplorerLink(STABLECOIN_CONFIGS.sUSDe.assetAddress)}\n${generateExplorerLink(STABLECOIN_CONFIGS.USDe.assetAddress)}`,
  website: "https://ethena.fi",
  auditLink: "https://www.ethena.fi/transparency",
  tags: ["algorithmic", "delta-hedged", "synthetic"],
};

export const STABLE_TOKENS: Record<string, string> = Object.fromEntries(
  Object.entries(STABLECOIN_CONFIGS).map(([symbol, config]) => [symbol, config.assetAddress])
);
