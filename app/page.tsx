"use client";

import { useRouter } from "next/navigation";
import { LandingSection } from "@/components/pages/tools/portfolio/LandingSection";

export default function Home() {
  const router = useRouter();

  const handleManualAddressSubmit = (address: string) => {
    // Navigate to portfolio with the wallet address as a query parameter
    router.push(`/tools/portfolio?wallet=${address}`);
  };

  return <LandingSection onManualAddressSubmit={handleManualAddressSubmit} />;
}
