"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";

import LandingPage from "@/components/pages/landing/Page";
import PortfolioPage from "@/components/pages/portfolio/Page";

export default function HomeClient() {
  const { account } = useWallet();

  // If wallet is connected, show portfolio page (which has its own header/footer)
  if (account) {
    return <PortfolioPage />;
  }

  // Otherwise, show landing page
  return <LandingPage />;
}
