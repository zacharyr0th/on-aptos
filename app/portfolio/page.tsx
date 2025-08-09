import { Metadata } from "next";

import PortfolioPage from "@/components/pages/portfolio/Page";

export const metadata: Metadata = {
  title: "Portfolio Analytics",
  description:
    "Track your Aptos wallet portfolio with real-time analytics. View your fungible assets, NFTs, and portfolio performance over time.",
  openGraph: {
    title: "Portfolio Analytics | On Aptos",
    description:
      "Track your Aptos wallet portfolio with real-time analytics. View your fungible assets, NFTs, and portfolio performance over time.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio Analytics | On Aptos",
    description: "Track your Aptos wallet portfolio with real-time analytics.",
  },
};

// This page is client-side only since it uses wallet connection
// No need for server-side rendering
export const dynamic = "force-static";

export default function Page() {
  return <PortfolioPage />;
}
