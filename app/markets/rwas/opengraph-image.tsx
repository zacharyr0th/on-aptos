import { createOgImage, ogImageConfig } from "@/lib/og-image";

export const alt = ogImageConfig.alt;
export const size = ogImageConfig.size;
export const contentType = ogImageConfig.contentType;
export const runtime = "edge";

export default async function Image() {
  return createOgImage({
    title: "Real World Assets",
    subtitle: "Track RWAs, tokenized assets, and traditional finance on Aptos",
    badge: "Markets",
    stats: [
      { label: "Tokenized", value: "RWAs" },
      { label: "TradFi", value: "Bridge" },
      { label: "Institutional", value: "Grade" },
    ],
  });
}
