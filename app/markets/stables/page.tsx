import { createPage } from "@/lib/utils/page-factory";
import dynamic from "next/dynamic";

// Lazy load the StablesPage component
const StablesPage = dynamic(() => import("@/components/pages/markets/stables/Page"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const pageConfig = createPage({
  title: "Stablecoin Analytics",
  description:
    "Track stablecoin supplies, adoption, and trends on Aptos blockchain. Real-time analytics for USDC, USDT, USDE, and other stablecoins.",
  Component: StablesPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
