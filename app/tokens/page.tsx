import TokensPage from "@/components/pages/tokens/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Token Analytics",
  description:
    "Explore all tokens on the Aptos blockchain. Track market caps, prices, supplies, and categories with real-time analytics.",
  Component: TokensPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
