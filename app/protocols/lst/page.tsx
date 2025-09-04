import LSTPage from "@/components/pages/protocols/lst/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Liquid Staking Analytics",
  description:
    "Track liquid staking tokens (LSTs) on Aptos blockchain. Monitor stAPT, amAPT, thAPT, sthAPT, kAPT, stkAPT, and tsAPT with real-time analytics and APY data.",
  Component: LSTPage,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
