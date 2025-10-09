import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Developer Activity",
    subtitle: "Track open-source repos, commits, and developer engagement on Aptos",
    badge: "Developer",
    stats: [
      { label: "GitHub", value: "Repos" },
      { label: "Developer", value: "Activity" },
      { label: "Code", value: "Analytics" },
    ],
  });
}
