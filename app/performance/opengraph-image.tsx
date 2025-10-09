import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Performance Analytics",
    subtitle: "Compare protocols, track returns, and analyze trends on Aptos",
    badge: "Analytics",
    stats: [
      { label: "Historical", value: "Data" },
      { label: "ROI", value: "Tracking" },
      { label: "Benchmark", value: "Analysis" },
    ],
  });
}
