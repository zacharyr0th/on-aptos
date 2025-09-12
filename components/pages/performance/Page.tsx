"use client";

import { GeistMono } from "geist/font/mono";
import { useState } from "react";
import { HelpCircle, Check } from "lucide-react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import USDTChart from "./USDTChart";
import USDTCostChart from "./USDTCostChart";

interface ChainMetric {
  name: string;
  logo: string; // Path to icon file
  metrics: {
    maxTps: string; // Max TPS (100 blocks)
    maxTpsOneBlock: string; // Max TPS (1 block)
    finality: string; // Finality time
    blockTime: string; // Block time
    nakamotoCoeff: string; // Nakamoto Coefficient
    validators: string; // Number of validators
  };
}

const ecosystems: ChainMetric[] = [
  {
    name: "Ethereum",
    logo: "/icons/performance/eth.png", // Ethereum diamond logo
    metrics: {
      maxTps: "62", // Max TPS (100 blocks)
      maxTpsOneBlock: "1,423", // Max TPS (1 block)
      finality: "12m48s", // Finality
      blockTime: "12.08s", // Block time
      nakamotoCoeff: "2", // Nakamoto Coefficient
      validators: "1,057,000", // Validators
    },
  },
  {
    name: "Solana",
    logo: "/icons/performance/sol.png",
    metrics: {
      maxTps: "4,709", // Max TPS (100 blocks)
      maxTpsOneBlock: "92,628", // Max TPS (1 block)
      finality: "12.8s", // Finality
      blockTime: "0.4s", // Block time
      nakamotoCoeff: "22", // Nakamoto Coefficient
      validators: "965", // Validators
    },
  },
  {
    name: "BSC",
    logo: "/icons/performance/bnb.png",
    metrics: {
      maxTps: "2,181", // Max TPS (100 blocks)
      maxTpsOneBlock: "5,116", // Max TPS (1 block)
      finality: "2s", // Finality
      blockTime: "0.75s", // Block time
      nakamotoCoeff: "7", // Nakamoto Coefficient
      validators: "45", // Validators
    },
  },
  {
    name: "Avalanche",
    logo: "/icons/performance/avax.png",
    metrics: {
      maxTps: "122", // Max TPS (100 blocks)
      maxTpsOneBlock: "846", // Max TPS (1 block)
      finality: "2s", // Finality
      blockTime: "1.72s", // Block time
      nakamotoCoeff: "28", // Nakamoto Coefficient
      validators: "890", // Validators
    },
  },
  {
    name: "Cardano",
    logo: "/icons/performance/ada.png",
    metrics: {
      maxTps: "11", // Max TPS (100 blocks)
      maxTpsOneBlock: "304", // Max TPS (1 block)
      finality: "2min", // Finality
      blockTime: "19.25s", // Block time
      nakamotoCoeff: "25", // Nakamoto Coefficient
      validators: "2,159", // Validators
    },
  },
  {
    name: "Sui",
    logo: "/icons/performance/sui.png",
    metrics: {
      maxTps: "926", // Max TPS (100 blocks)
      maxTpsOneBlock: "11,543", // Max TPS (1 block)
      finality: "<1s", // Finality
      blockTime: "0.25s", // Block time
      nakamotoCoeff: "18", // Nakamoto Coefficient
      validators: "121", // Validators
    },
  },
  {
    name: "TRON",
    logo: "/icons/performance/trx.png",
    metrics: {
      maxTps: "272", // Max TPS
      maxTpsOneBlock: "734", // Max TPS (1 block)
      finality: "57s", // Finality
      blockTime: "3s", // Block time
      nakamotoCoeff: "5", // Nakamoto Coefficient
      validators: "27", // Validators
    },
  },
  {
    name: "Base",
    logo: "/icons/performance/base.png", // Coinbase Base logo
    metrics: {
      maxTps: "1,267", // Max TPS (100 blocks)
      maxTpsOneBlock: "1,930", // Max TPS (1 block)
      finality: "13m13s", // Finality
      blockTime: "2s", // Block time
      nakamotoCoeff: "1", // Nakamoto Coefficient
      validators: "1", // Validators (centralized sequencer)
    },
  },
  {
    name: "Bitcoin",
    logo: "/icons/performance/btc.png",
    metrics: {
      maxTps: "13", // Max TPS (100 blocks)
      maxTpsOneBlock: "6,916", // Max TPS (1 block)
      finality: "1h", // Finality
      blockTime: "6min 11s", // Block time
      nakamotoCoeff: "3", // Nakamoto Coefficient
      validators: "108", // Miners (using as validators equivalent)
    },
  },
];

// USDT transaction data showing Aptos dominance
const usdtData = [
  {
    chain: "Aptos",
    transactions: 2850000,
    logo: "/icons/apt.png",
    color: "#00D4AA"
  },
  {
    chain: "Ethereum",
    transactions: 1200000,
    logo: "/icons/performance/eth.png",
    color: "#627EEA"
  },
  {
    chain: "BSC",
    transactions: 900000,
    logo: "/icons/performance/bnb.png",
    color: "#F3BA2F"
  },
  {
    chain: "TRON",
    transactions: 1800000,
    logo: "/icons/performance/trx.png",
    color: "#FF060A"
  },
  {
    chain: "Solana",
    transactions: 650000,
    logo: "/icons/performance/sol.png",
    color: "#9945FF"
  },
  {
    chain: "Polygon",
    transactions: 420000,
    logo: "/icons/performance/polygon.png",
    color: "#8247E5"
  }
];


const aptosMetrics = {
  maxTps: "12,933", // Max TPS (100 blocks)
  maxTpsOneBlock: "22,032", // Max TPS (1 block)
  finality: "<1s", // Finality
  blockTime: "0.11s", // Block time
  nakamotoCoeff: "19", // Nakamoto Coefficient
  validators: "151", // Validators
};

function formatTPS(value: string): string {
  const cleanValue = value.replace(/[,<>]/g, "");
  const num = parseInt(cleanValue);
  
  if (num < 1000) {
    return num.toString();
  } else if (num < 10000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
  } else {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
  }
}

function parseValue(value: string): number {
  const cleaned = value.replace(/[,<>]/g, "");
  
  // Handle time formats like "13m13s", "12m48s", "1h", etc.
  if (cleaned.includes("h")) {
    const hours = parseFloat(cleaned.replace("h", ""));
    return hours * 3600; // Convert hours to seconds
  }
  
  if (cleaned.includes("m") && cleaned.includes("s")) {
    // Handle format like "13m13s"
    const parts = cleaned.split("m");
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1].replace("s", ""));
    return (minutes * 60) + seconds;
  }
  
  if (cleaned.includes("min")) {
    // Convert minutes to seconds for comparison
    const minValue = parseFloat(cleaned.replace("min", ""));
    return minValue * 60;
  }
  
  if (cleaned.includes("s")) {
    return parseFloat(cleaned.replace("s", ""));
  }
  
  if (cleaned.includes("+")) {
    return parseInt(cleaned.replace("+", ""));
  }
  
  return parseInt(cleaned);
}

function compareMetrics(
  metric: string,
  aptosValue: string,
  competitorValue: string
): { aptosWins: boolean; competitorWins: boolean } {
  const aptosNum = parseValue(aptosValue);
  const competitorNum = parseValue(competitorValue);

  switch (metric) {
    case "maxTps":
    case "maxTpsOneBlock":
    case "nakamotoCoeff":
    case "validators":
      // Higher is better
      return {
        aptosWins: aptosNum > competitorNum,
        competitorWins: competitorNum > aptosNum,
      };
    case "finality":
    case "blockTime":
      // Lower is better
      return {
        aptosWins: aptosNum < competitorNum,
        competitorWins: competitorNum < aptosNum,
      };
    default:
      return { aptosWins: false, competitorWins: false };
  }
}

function findBestMetric(metric: string, values: { name: string; value: string }[]): string[] {
  if (values.length === 0) return [];

  const isHigherBetter = ["maxTps", "maxTpsOneBlock", "nakamotoCoeff", "validators"].includes(
    metric
  );

  const sortedValues = values
    .map((v) => ({ ...v, numValue: parseValue(v.value) }))
    .sort((a, b) => (isHigherBetter ? b.numValue - a.numValue : a.numValue - b.numValue));

  const bestValue = sortedValues[0].numValue;
  return sortedValues.filter((v) => v.numValue === bestValue).map((v) => v.name);
}

function calculatePercentageDifference(
  metric: string, 
  aptosValue: string, 
  competitorValue: string
): string | null {
  const isHigherBetter = ["maxTps", "maxTpsOneBlock", "nakamotoCoeff", "validators"].includes(metric);
  const aptosNum = parseValue(aptosValue);
  const competitorNum = parseValue(competitorValue);
  
  if (aptosNum === 0 || competitorNum === 0) return null;
  
  let multiplier: number;
  
  if (isHigherBetter) {
    // For metrics where higher is better, show how much better Aptos is
    if (aptosNum > competitorNum) {
      multiplier = aptosNum / competitorNum;
      return multiplier >= 10 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(1)}x`;
    }
  } else {
    // For metrics where lower is better (finality, blockTime), show how much worse the competitor is
    if (aptosNum < competitorNum) {
      multiplier = competitorNum / aptosNum;
      return multiplier >= 10 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(1)}x`;
    }
  }
  
  return null;
}


function MetricBox({
  value,
  label,
  isWinner = false,
  isPrimary = false,
  tooltip = null,
  chainLogo = null,
  chainName = null,
  percentageDifference = null,
}: {
  value: string;
  label: string;
  isWinner?: boolean;
  isPrimary?: boolean;
  tooltip?: React.ReactNode;
  chainLogo?: string | null;
  chainName?: string | null;
  percentageDifference?: string | null;
}) {
  const baseClasses =
    "text-center p-6 border rounded relative transition-all duration-200 min-h-[130px] flex flex-col justify-center";
  const winnerClasses = isWinner ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "";
  const valueClasses = isPrimary
    ? `text-2xl xl:text-3xl font-bold font-mono mb-3 leading-tight ${isWinner ? "text-green-600 dark:text-green-400" : "text-primary"}`
    : `text-2xl xl:text-3xl font-bold font-mono mb-3 leading-tight ${isWinner ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`;

  return (
    <div className="relative">
      <div className={`${baseClasses} ${winnerClasses}`}>
        {/* Chain Logo in top-left corner */}
        {chainLogo && (
          <div className="absolute top-3 left-3">
            {chainLogo.startsWith("/") ? (
              <Image
                src={chainLogo}
                alt={chainName || ""}
                width={16}
                height={16}
                className="rounded-sm opacity-60"
              />
            ) : (
              <span className="text-sm opacity-60">{chainLogo}</span>
            )}
          </div>
        )}

        {/* Winner check or percentage difference in top-right corner */}
        {isWinner ? (
          <Check className="absolute top-3 right-3 h-4 w-4 text-green-600 dark:text-green-400" />
        ) : percentageDifference ? (
          <div className="absolute top-3 right-3">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-medium">
              {percentageDifference}
            </div>
          </div>
        ) : null}

        <div className={valueClasses}>{value}</div>
        <div className="font-medium text-sm text-muted-foreground flex items-center justify-center gap-1 leading-relaxed">
          <span className="whitespace-nowrap">{label}</span>
          {tooltip}
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("performance");
  const [selectedEcosystems, setSelectedEcosystems] = useState<ChainMetric[]>(() => {
    // Set default comparisons: Sui, TRON, and Base
    return ecosystems.filter(ecosystem => 
      ecosystem.name === "Sui" || ecosystem.name === "TRON" || ecosystem.name === "Base"
    );
  });
  const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === "usdt") {
      router.push("/performance/usdt-comparison");
      return;
    }
    setActiveTab(value);
  };

  const toggleEcosystem = (ecosystem: ChainMetric) => {
    setSelectedEcosystems((prev) => {
      const isSelected = prev.some((e) => e.name === ecosystem.name);
      if (isSelected) {
        return prev.filter((e) => e.name !== ecosystem.name);
      } else if (prev.length < 3) {
        return [...prev, ecosystem];
      }
      return prev;
    });
  };

  const clearAll = () => {
    setSelectedEcosystems([]);
  };

  return (
    <ErrorBoundary>
      <div className={`${GeistMono.className}`}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 min-h-[calc(100vh-200px)]">
          <div className="flex gap-12">
            {/* Sidebar - only show for performance tab */}
            {activeTab === "performance" && (
              <aside className="w-48 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Compare ({selectedEcosystems.length}/3)
                  </h2>
                  {selectedEcosystems.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {ecosystems.map((ecosystem) => {
                    const isSelected = selectedEcosystems.some((e) => e.name === ecosystem.name);
                    const canSelect = selectedEcosystems.length < 3 || isSelected;

                    return (
                      <button
                        key={ecosystem.name}
                        onClick={() => toggleEcosystem(ecosystem)}
                        disabled={!canSelect}
                        className={`w-full text-left p-3 rounded transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : canSelect
                              ? "hover:bg-accent"
                              : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {ecosystem.logo.startsWith("/") ? (
                            <Image
                              src={ecosystem.logo}
                              alt={ecosystem.name}
                              width={20}
                              height={20}
                              className="rounded-sm"
                            />
                          ) : (
                            <span className="text-lg">{ecosystem.logo}</span>
                          )}
                          <span>{ecosystem.name}</span>
                          {isSelected && <span className="ml-auto text-xs">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* Main Content */}
            <main className={activeTab === "usdt" ? "w-full" : "flex-1"}>
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {selectedEcosystems.length > 0
                      ? `Aptos vs ${selectedEcosystems.map((e) => e.name).join(" vs ")}`
                      : "Aptos Performance"}
                  </h1>
                </div>

                {/* Data Attribution */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>Data powered by</span>
                  <a 
                    href="https://chainspect.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Image
                      src="/chainspect_icon_squared.png"
                      alt="Chainspect"
                      width={18}
                      height={18}
                      className="rounded-sm"
                    />
                    <span className="font-medium text-foreground">Chainspect</span>
                  </a>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="performance">Chain Performance</TabsTrigger>
                  <TabsTrigger value="usdt">USDT Dominance</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-8">

                {selectedEcosystems.length > 0 ? (
                  <div className="space-y-6">
                  {/* Render Aptos first, then selected ecosystems */}
                  {[
                    {
                      name: "Aptos",
                      logo: "/icons/apt.png",
                      metrics: aptosMetrics,
                      isPrimary: true,
                    },
                    ...selectedEcosystems.map((eco) => ({ ...eco, isPrimary: false })),
                  ].map((chain, index) => {
                    // Calculate which metrics this chain wins
                    const allChains = [
                      { name: "Aptos", value: aptosMetrics.maxTps },
                      ...selectedEcosystems.map((e) => ({ name: e.name, value: e.metrics.maxTps })),
                    ];

                    const metricWinners = {
                      maxTps: findBestMetric(
                        "maxTps",
                        allChains.map((c) => ({ name: c.name, value: c.value }))
                      ),
                      maxTpsOneBlock: findBestMetric("maxTpsOneBlock", [
                        { name: "Aptos", value: aptosMetrics.maxTpsOneBlock },
                        ...selectedEcosystems.map((e) => ({
                          name: e.name,
                          value: e.metrics.maxTpsOneBlock,
                        })),
                      ]),
                      finality: findBestMetric("finality", [
                        { name: "Aptos", value: aptosMetrics.finality },
                        ...selectedEcosystems.map((e) => ({
                          name: e.name,
                          value: e.metrics.finality,
                        })),
                      ]),
                      blockTime: findBestMetric("blockTime", [
                        { name: "Aptos", value: aptosMetrics.blockTime },
                        ...selectedEcosystems.map((e) => ({
                          name: e.name,
                          value: e.metrics.blockTime,
                        })),
                      ]),
                      nakamotoCoeff: findBestMetric("nakamotoCoeff", [
                        { name: "Aptos", value: aptosMetrics.nakamotoCoeff },
                        ...selectedEcosystems.map((e) => ({
                          name: e.name,
                          value: e.metrics.nakamotoCoeff,
                        })),
                      ]),
                      validators: findBestMetric("validators", [
                        { name: "Aptos", value: aptosMetrics.validators },
                        ...selectedEcosystems.map((e) => ({
                          name: e.name,
                          value: e.metrics.validators,
                        })),
                      ]),
                    };

                    return (
                      <div key={chain.name}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                          <MetricBox
                            value={formatTPS(chain.metrics.maxTps)}
                            label="Max TPS (100 blocks)"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.maxTps.includes(chain.name)}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                            percentageDifference={
                              !metricWinners.maxTps.includes(chain.name) && !chain.isPrimary
                                ? calculatePercentageDifference("maxTps", aptosMetrics.maxTps, chain.metrics.maxTps)
                                : null
                            }
                          />
                          <MetricBox
                            value={formatTPS(chain.metrics.maxTpsOneBlock)}
                            label="Max TPS (1 block)"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.maxTpsOneBlock.includes(chain.name)}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                            percentageDifference={
                              !metricWinners.maxTpsOneBlock.includes(chain.name) && !chain.isPrimary
                                ? calculatePercentageDifference("maxTpsOneBlock", aptosMetrics.maxTpsOneBlock, chain.metrics.maxTpsOneBlock)
                                : null
                            }
                          />
                          <MetricBox
                            value={chain.metrics.finality}
                            label="Finality"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.finality.includes(chain.name)}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                            percentageDifference={
                              !metricWinners.finality.includes(chain.name) && !chain.isPrimary
                                ? calculatePercentageDifference("finality", aptosMetrics.finality, chain.metrics.finality)
                                : null
                            }
                          />
                          <MetricBox
                            value={chain.metrics.blockTime}
                            label="Block Time"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.blockTime.includes(chain.name)}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                            percentageDifference={
                              !metricWinners.blockTime.includes(chain.name) && !chain.isPrimary
                                ? calculatePercentageDifference("blockTime", aptosMetrics.blockTime, chain.metrics.blockTime)
                                : null
                            }
                          />
                          <MetricBox
                            value={chain.metrics.nakamotoCoeff}
                            label="Nakamoto"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.nakamotoCoeff.includes(chain.name)}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                            percentageDifference={
                              !metricWinners.nakamotoCoeff.includes(chain.name) && !chain.isPrimary
                                ? calculatePercentageDifference("nakamotoCoeff", aptosMetrics.nakamotoCoeff, chain.metrics.nakamotoCoeff)
                                : null
                            }
                            tooltip={
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm max-w-xs">
                                    Minimum entities needed to control &gt;50% of network resources.
                                    Higher = more decentralized.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            }
                          />
                          <MetricBox
                            value={chain.metrics.validators}
                            label="Validators"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.validators.includes(chain.name)}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                            percentageDifference={
                              !metricWinners.validators.includes(chain.name) && !chain.isPrimary
                                ? calculatePercentageDifference("validators", aptosMetrics.validators, chain.metrics.validators)
                                : null
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <MetricBox
                    value={formatTPS(aptosMetrics.maxTps)}
                    label="Max TPS (100 blocks)"
                    isPrimary={true}
                  />
                  <MetricBox
                    value={formatTPS(aptosMetrics.maxTpsOneBlock)}
                    label="Max TPS (1 block)"
                    isPrimary={true}
                  />
                  <MetricBox
                    value={aptosMetrics.finality}
                    label="Finality"
                    isPrimary={true}
                  />
                  <MetricBox
                    value={aptosMetrics.blockTime}
                    label="Block Time"
                    isPrimary={true}
                  />
                  <MetricBox
                    value={aptosMetrics.nakamotoCoeff}
                    label="Nakamoto"
                    isPrimary={true}
                    tooltip={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">
                            Minimum entities needed to control &gt;50% of network resources. Higher
                            = more decentralized.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    }
                  />
                  <MetricBox
                    value={aptosMetrics.validators}
                    label="Validators"
                    isPrimary={true}
                  />
                  </div>
                )}
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
