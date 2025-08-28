import StablesPage from "@/components/pages/stables/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Stablecoin Analytics",
  description:
    "Track stablecoin supplies, adoption, and trends on Aptos blockchain. Real-time analytics for USDC, USDT, USDE, and other stablecoins.",
  Component: StablesPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
