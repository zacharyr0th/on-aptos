import NextDynamic from "next/dynamic";
import { createPage } from "@/lib/utils/page-factory";

// Lazy load the DeFiPage component
const DeFiPage = NextDynamic(() => import("@/components/pages/protocols/defi/Page"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const pageConfig = createPage({
  title: "DeFi Intelligence Dashboard",
  description:
    "Professional DeFi analytics for institutional investors and advanced traders. Real-time intelligence on protocols, TVL, yields, and market activity across the Aptos ecosystem.",
  Component: DeFiPage,
  dynamic: "force-static",
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export const dynamic = "force-static";
export default pageConfig.default;
