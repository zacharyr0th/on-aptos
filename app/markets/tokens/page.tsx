import { createPage } from "@/lib/utils/page-factory";
import dynamic from "next/dynamic";

// Lazy load the TokensPage component to reduce initial bundle size
const TokensPage = dynamic(() => import("@/components/pages/markets/tokens/Page"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const pageConfig = createPage({
  title: "Token Analytics Dashboard",
  description:
    "Professional token analysis for institutional traders and advanced investors. Comprehensive market data, price tracking, supply analytics, and categorization across all Aptos blockchain assets.",
  Component: TokensPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
