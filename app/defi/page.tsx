import DeFiPage from "@/components/pages/defi/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "DeFi Analytics",
  description:
    "Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem. Real-time analytics for DEXs, lending protocols, and yield farms.",
  Component: DeFiPage,
  dynamic: "force-static",
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export const dynamic = "force-static";
export default pageConfig.default;
