import YieldsPage from "@/components/pages/yields/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Yield Analytics",
  description:
    "Track DeFi yields and APY opportunities across the Aptos ecosystem. Compare yields from lending protocols, liquidity pools, and staking opportunities.",
  Component: YieldsPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
