import { Metadata } from "next";

import StablesPage from "@/components/pages/stables/Page";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "Stablecoin Analytics",
  description:
    "Track stablecoin supplies, adoption, and trends on Aptos blockchain. Real-time analytics for USDC, USDT, USDE, and other stablecoins.",
  openGraph: {
    title: "Stablecoin Analytics | On Aptos",
    description:
      "Track stablecoin supplies, adoption, and trends on Aptos blockchain. Real-time analytics for USDC, USDT, USDE, and other stablecoins.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stablecoin Analytics | On Aptos",
    description:
      "Track stablecoin supplies, adoption, and trends on Aptos blockchain.",
  },
};

export default function Page() {
  return <StablesPage />;
}
