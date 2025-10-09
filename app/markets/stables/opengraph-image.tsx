import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Stablecoins on Aptos",
    subtitle: "Monitor stablecoin liquidity, yields, and cross-chain flows",
    badge: "Markets",
    stats: [
      { label: "Multi-Chain", value: "USDT" },
      { label: "Native", value: "USDC" },
      { label: "Stable", value: "Yields" },
    ],
  });
}
