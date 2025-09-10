import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Metrics - On Aptos",
  description:
    "Comprehensive analytics and metrics for the Aptos ecosystem, including DeFi TVL, transaction volumes, and network statistics.",
};

export default function MetricsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Analytics & Metrics</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This page is under construction.
          </p>
        </div>
      </div>
    </div>
  );
}
