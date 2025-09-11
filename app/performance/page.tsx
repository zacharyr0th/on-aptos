import PerformancePage from "@/components/pages/performance/Page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aptos Performance Comparison",
  description:
    "Discover why Aptos is the fastest, cheapest, and most efficient blockchain. Compare transaction speeds, fees, and finality across major blockchains.",
};

export const revalidate = 3600;

export default function Performance() {
  return <PerformancePage />;
}