import dynamic from "next/dynamic";
import { createPage } from "@/lib/utils/page-factory";

// Lazy load the RWAsPageComponent component
const RWAsPageComponent = dynamic(() => import("@/components/pages/markets/rwas/Page"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const pageConfig = createPage({
  title: "Real World Assets Analytics",
  description:
    "Track tokenized real world assets (RWAs) on Aptos blockchain. Monitor treasury bills, commodities, real estate, and other asset-backed tokens.",
  Component: RWAsPageComponent,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
