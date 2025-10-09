import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Bitcoin on Aptos",
    subtitle: "Track wrapped Bitcoin, liquidity, and yields across Aptos DeFi",
    badge: "Markets",
    stats: [
      { label: "Cross-Chain", value: "BTC" },
      { label: "Real-time", value: "Data" },
      { label: "DeFi", value: "Ready" },
    ],
  });
}
