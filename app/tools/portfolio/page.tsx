import PortfolioPage from "@/components/pages/tools/portfolio/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Portfolio Analytics",
  description:
    "Track your complete Aptos portfolio. Monitor DeFi positions, NFT collections, and token analytics with real-time data and professional insights.",
  Component: PortfolioPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
