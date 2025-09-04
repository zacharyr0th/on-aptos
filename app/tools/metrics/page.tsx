import MetricsPage from "@/components/pages/metrics/MetricsSimple";
import { createPage } from "@/lib/utils/page-factory";

const pageConfig = createPage({
  title: "Ecosystem Metrics",
  description:
    "Real-time metrics and analytics for the Aptos blockchain ecosystem. Track network performance, transaction volume, token statistics, and ecosystem growth.",
  Component: MetricsPage,
  dynamic: "force-static",
});

export const metadata = pageConfig.metadata;
export const revalidate = 3600;
export const dynamic = "force-static";
export default pageConfig.default;
