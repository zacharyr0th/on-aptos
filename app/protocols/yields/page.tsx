import YieldsPage from "@/components/pages/protocols/yields/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Yield Opportunities Dashboard",
  description:
    "Professional yield analysis for institutional capital deployment. Advanced APY tracking, risk-adjusted returns, and optimization across lending protocols, liquidity pools, and staking opportunities in the Aptos DeFi ecosystem.",
  Component: YieldsPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
