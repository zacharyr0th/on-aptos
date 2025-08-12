"use client";

import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TransactionHistoryTable } from "./TransactionHistoryTable";
import { YieldTable } from "./YieldTable";

interface PortfolioTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  normalizedAddress: string;
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
}

export function PortfolioTabs({
  activeTab,
  setActiveTab,
  normalizedAddress,
  sidebarContent,
  mainContent,
}: PortfolioTabsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
      {/* Sidebar */}
      <div className="lg:col-span-2 space-y-6">{sidebarContent}</div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="yields">Yields</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            {mainContent}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionHistoryTable
              walletAddress={normalizedAddress}
              initialLimit={100}
            />
          </TabsContent>

          <TabsContent value="yields" className="space-y-6">
            <YieldTable walletAddress={normalizedAddress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
