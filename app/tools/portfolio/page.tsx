import PortfolioPage from "@/components/pages/tools/portfolio/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Your Complete Aptos Portfolio",
  description:
    "Track your complete Aptos portfolio in one place. Monitor DeFi positions, NFT collections, tokens, and transaction history with real-time analytics and insights.",
  Component: PortfolioPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
