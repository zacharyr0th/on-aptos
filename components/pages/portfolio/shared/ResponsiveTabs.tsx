"use client";

import { Eye, EyeOff } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Tab configuration interface
export interface TabConfig {
  value: string;
  label: string;
  count?: number | string;
  content: React.ReactNode;
  disabled?: boolean;
}

// Eye toggle configuration
export interface EyeToggleConfig {
  show: boolean;
  onToggle: () => void;
  showTitle?: string;
  hideTitle?: string;
}

// Responsive tabs props
interface ResponsiveTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (value: string) => void;
  eyeToggle?: EyeToggleConfig;
  className?: string;
  variant?: "default" | "borderless";
  // Layout control
  showBorder?: boolean;
  tabsClassName?: string;
  contentClassName?: string;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  eyeToggle,
  className = "",
  variant = "default",
  showBorder = true,
  tabsClassName = "",
  contentClassName = "",
}) => {
  const borderClass = showBorder
    ? "border-b border-neutral-200 dark:border-neutral-800"
    : "";
  const baseTabClass =
    variant === "borderless"
      ? "rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
      : "rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground";

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={`w-full ${className}`}
    >
      {/* Tab headers with optional eye toggle */}
      <div className={`flex justify-between items-end w-full ${borderClass}`}>
        <TabsList
          className={`flex justify-start rounded-none bg-transparent p-0 h-auto border-none ${tabsClassName}`}
        >
          {tabs.map((tab, index) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={`${baseTabClass} ${index > 0 ? "ml-8" : ""}`}
            >
              {tab.label}
              {tab.count !== undefined && <> ({tab.count})</>}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Eye toggle button */}
        {eyeToggle && (
          <div className="flex items-center pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={eyeToggle.onToggle}
              className="h-8 w-8 p-0 hover:bg-muted"
              title={
                eyeToggle.show
                  ? eyeToggle.hideTitle || "Hide filtered items"
                  : eyeToggle.showTitle || "Show filtered items"
              }
            >
              {eyeToggle.show ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Tab contents */}
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={`mt-6 p-0 ${contentClassName}`}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Specialized portfolio tabs component
interface PortfolioTabsProps {
  // Tab data
  tokensCount: number;
  nftsCount: number | string;

  // Active tab
  activeTab: string;
  onTabChange: (tab: string) => void;

  // Content
  tokensContent: React.ReactNode;
  nftsContent: React.ReactNode;

  // Eye toggle (typically for tokens tab)
  eyeToggle?: EyeToggleConfig;

  // Styling
  className?: string;
}

export const PortfolioTabs: React.FC<PortfolioTabsProps> = ({
  tokensCount,
  nftsCount,
  activeTab,
  onTabChange,
  tokensContent,
  nftsContent,
  eyeToggle,
  className = "",
}) => {
  const tabs: TabConfig[] = [
    {
      value: "assets",
      label: "Tokens",
      count: tokensCount,
      content: tokensContent,
    },
    {
      value: "nfts",
      label: "NFTs",
      count: nftsCount,
      content: nftsContent,
    },
  ];

  // Only show eye toggle for assets/tokens tab
  const shouldShowEyeToggle = eyeToggle && activeTab === "assets";

  return (
    <ResponsiveTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      eyeToggle={shouldShowEyeToggle ? eyeToggle : undefined}
      variant="borderless"
      className={className}
    />
  );
};

// Main content tabs (Portfolio/Transactions)
interface MainContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  portfolioContent: React.ReactNode;
  transactionsContent: React.ReactNode;
  portfolioValue?: number;
  className?: string;
  hideOnMobile?: boolean;
}

export const MainContentTabs: React.FC<MainContentTabsProps> = ({
  activeTab,
  onTabChange,
  portfolioContent,
  transactionsContent,
  portfolioValue,
  className = "",
  hideOnMobile = false,
}) => {
  const tabs: TabConfig[] = [
    {
      value: "portfolio",
      label: "Portfolio",
      content: portfolioContent,
    },
    {
      value: "transactions",
      label: "Transactions",
      content: transactionsContent,
    },
  ];

  return (
    <div className={hideOnMobile ? "hidden lg:block" : ""}>
      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className={`h-full ${className}`}
      >
        <div className="w-full pb-3">
          <div className="flex justify-between items-center">
            <div className="flex justify-between items-end w-full border-b border-neutral-200 dark:border-neutral-800">
              <TabsList className="flex justify-start gap-8 rounded-none bg-transparent p-0 h-auto border-none">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Portfolio value indicator */}
              {portfolioValue !== undefined && (
                <div className="flex items-center pb-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Portfolio Value
                    </p>
                    <p className="text-lg font-geist-mono text-foreground">
                      <span className="font-bold">
                        ${portfolioValue.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-2 p-0">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
