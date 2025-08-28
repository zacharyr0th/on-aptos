import RWAsPageComponent from "@/components/pages/rwas/Page";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Real World Assets Analytics",
  description:
    "Track tokenized real world assets (RWAs) on Aptos blockchain. Monitor treasury bills, commodities, real estate, and other asset-backed tokens.",
  Component: RWAsPageComponent,
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export default pageConfig.default;
