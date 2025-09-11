import dynamic from "next/dynamic";
import { createPage } from "@/lib/utils/page-factory";

// Lazy load the PerformancePage component
const PerformancePage = dynamic(() => import("@/components/pages/performance/Page"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const pageConfig = createPage({
  title: "USDT Performance Comparison",
  description:
    "Discover why Aptos is the fastest, cheapest, and most efficient blockchain for USDT transfers. Compare transaction speeds, fees, and finality across major blockchains.",
  Component: PerformancePage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;