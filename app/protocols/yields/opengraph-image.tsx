import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Yield Opportunities",
    subtitle: "Compare yields, farms, and vaults across Aptos protocols",
    badge: "Protocols",
    stats: [
      { label: "Auto", value: "Compound" },
      { label: "Optimized", value: "Returns" },
      { label: "Risk", value: "Adjusted" },
    ],
  });
}
