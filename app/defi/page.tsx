import { Metadata } from "next";

import DeFiPage from "@/components/pages/defi/Page";

// Force static generation - DeFi data is imported statically
export const revalidate = 3600; // 1 hour
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "DeFi Analytics",
  description:
    "Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem. Real-time analytics for DEXs, lending protocols, and yield farms.",
  openGraph: {
    title: "DeFi Analytics | On Aptos",
    description:
      "Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem. Real-time analytics for DEXs, lending protocols, and yield farms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeFi Analytics | On Aptos",
    description:
      "Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem.",
  },
};

export default function Page() {
  return <DeFiPage />;
}
