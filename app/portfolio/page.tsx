import PortfolioPage from "@/components/pages/tools/portfolio/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Portfolio Analytics",
  description:
    "Track your Aptos wallet portfolio with real-time analytics. View your fungible assets, NFTs, and portfolio performance over time.",
  Component: PortfolioPage,
  dynamic: "force-static",
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export const dynamic = "force-static";
export default pageConfig.default;
