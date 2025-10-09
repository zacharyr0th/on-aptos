import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Aptos Token Markets",
    subtitle: "Real-time prices, liquidity, and analytics for all Aptos tokens",
    badge: "Markets",
    stats: [
      { label: "Live", value: "Prices" },
      { label: "24/7", value: "Markets" },
      { label: "Deep", value: "Liquidity" },
    ],
  });
}
