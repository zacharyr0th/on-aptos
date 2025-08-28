import BitcoinPage from "@/components/pages/btc/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Bitcoin Analytics",
  description:
    "Track Bitcoin on Aptos blockchain. Monitor wrapped BTC tokens, liquidity, and cross-chain activity with real-time analytics.",
  Component: BitcoinPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
