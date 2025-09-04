import { createPage } from "@/lib/utils/page-factory";
import dynamic from "next/dynamic";

// Lazy load the BitcoinPage component
const BitcoinPage = dynamic(() => import("@/components/pages/markets/btc/Page"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const pageConfig = createPage({
  title: "Bitcoin Analytics",
  description:
    "Track Bitcoin on Aptos blockchain. Monitor wrapped BTC tokens, liquidity, and cross-chain activity with real-time analytics.",
  Component: BitcoinPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
