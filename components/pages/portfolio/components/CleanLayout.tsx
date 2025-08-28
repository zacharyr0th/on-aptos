import React, { memo } from "react";

import type {
  PortfolioAsset,
  PortfolioMetrics,
  NFT,
  DeFiPosition,
  Transaction,
  ChartDataPoint,
} from "@/lib/services/portfolio/types";

import { PriceList } from "./PriceList";

interface CleanLayoutProps {
  address: string;
  data: {
    assets: PortfolioAsset[];
    nfts: { items: NFT[]; total: number; hasMore: boolean };
    defi: DeFiPosition[];
    transactions: Transaction[];
    totalValue: number;
    pieChartData: ChartDataPoint[];
    metrics: PortfolioMetrics | null;
    aptPrice: number;
  };
  ui: {
    selectedItem: { type: "asset" | "nft" | "defi"; data: any } | null;
    activeTab: "portfolio" | "transactions" | "yield";
    sidebarView: "assets" | "nfts" | "defi";
    hideFilteredAssets: boolean;
  };
  actions: {
    selectItem: (type: "asset" | "nft" | "defi" | null, data: any) => void;
    setTab: (tab: "portfolio" | "transactions" | "yield") => void;
    toggleFilter: () => void;
    refetch: () => void;
  };
}

// Memoized sub-components for performance
const Sidebar = memo(
  ({
    data,
    ui,
    actions,
  }: Pick<CleanLayoutProps, "data" | "ui" | "actions">) => (
    <aside className="w-80 space-y-4">
      <div className="bg-card rounded-lg p-4">
        <h2 className="text-2xl font-bold">
          ${data.totalValue.toLocaleString()}
        </h2>
        <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
      </div>

      <div className="bg-card rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <span>Assets</span>
          <span>{data.assets.length}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>NFTs</span>
          <span>{data.nfts.total}</span>
        </div>
        <div className="flex justify-between">
          <span>DeFi</span>
          <span>{data.defi.length}</span>
        </div>
      </div>
    </aside>
  ),
);
Sidebar.displayName = "Sidebar";

const MainContent = memo(
  ({
    data,
    ui,
    actions,
  }: Pick<CleanLayoutProps, "data" | "ui" | "actions">) => (
    <div className="flex-1">
      <div className="bg-card rounded-lg p-6">
        <div className="flex gap-2 mb-6">
          {(["portfolio", "transactions", "yield"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => actions.setTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                ui.activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {ui.activeTab === "portfolio" && (
          <div className="space-y-4">
            {data.assets.map((asset) => (
              <div
                key={asset.asset_type}
                onClick={() => actions.selectItem("asset", asset)}
                className={`p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                  ui.selectedItem?.type === "asset" &&
                  ui.selectedItem.data === asset
                    ? "border-primary"
                    : ""
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{asset.metadata?.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.metadata?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${asset.value?.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {asset.balance} {asset.metadata?.symbol}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {ui.activeTab === "transactions" && (
          <div className="space-y-2">
            {data.transactions.slice(0, 20).map((tx) => (
              <div
                key={tx.transaction_version}
                className="p-3 rounded-lg border"
              >
                <div className="flex justify-between">
                  <span className="text-sm">{tx.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(tx.transaction_timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ),
);
MainContent.displayName = "MainContent";

export function CleanLayout({ address, data, ui, actions }: CleanLayoutProps) {
  return (
    <div className="container mx-auto">
      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        <Sidebar data={data} ui={ui} actions={actions} />
        <MainContent data={data} ui={ui} actions={actions} />
        <PriceList className="w-full" />
      </div>

      {/* Desktop Layout - Now with 3 columns */}
      <div className="hidden lg:flex gap-6">
        <Sidebar data={data} ui={ui} actions={actions} />
        <MainContent data={data} ui={ui} actions={actions} />
        <PriceList className="w-80 flex-shrink-0" />
      </div>
    </div>
  );
}
