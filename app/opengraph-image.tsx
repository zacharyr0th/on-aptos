import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Professional Blockchain Analytics",
    subtitle:
      "Institutional-grade portfolio tracking and professional DeFi analytics for advanced traders",
    badge: "Analytics Platform",
    stats: [
      { label: "Real-time", value: "Data" },
      { label: "25+", value: "Protocols" },
      { label: "Pro", value: "Analytics" },
    ],
  });
}
