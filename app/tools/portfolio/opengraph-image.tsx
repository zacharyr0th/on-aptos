import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Portfolio Tracker",
    subtitle: "Track your Aptos assets, yields, and performance in real-time",
    badge: "Tools",
    stats: [
      { label: "Live", value: "Tracking" },
      { label: "Multi-Wallet", value: "Support" },
      { label: "Performance", value: "Analytics" },
    ],
  });
}
