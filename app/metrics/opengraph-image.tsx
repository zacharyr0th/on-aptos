import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Network Metrics",
    subtitle: "Monitor Aptos blockchain activity, transactions, and growth metrics",
    badge: "Analytics",
    stats: [
      { label: "On-Chain", value: "Activity" },
      { label: "Network", value: "Stats" },
      { label: "Growth", value: "Metrics" },
    ],
  });
}
