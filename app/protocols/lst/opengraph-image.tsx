import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Liquid Staking Tokens",
    subtitle: "Track LST protocols, yields, and staking opportunities on Aptos",
    badge: "Protocols",
    stats: [
      { label: "Staking", value: "APY" },
      { label: "Liquid", value: "Assets" },
      { label: "Validator", value: "Network" },
    ],
  });
}
