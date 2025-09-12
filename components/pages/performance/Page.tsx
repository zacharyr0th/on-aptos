"use client";

import { GeistMono } from "geist/font/mono";
import { useState } from "react";
import { HelpCircle, Check } from "lucide-react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Image from "next/image";

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
    name: "BNB Chain",
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

const aptosMetrics = {
  maxTps: "12,933", // Max TPS (100 blocks)
  maxTpsOneBlock: "22,032", // Max TPS (1 block)
  finality: "<1s", // Finality
  blockTime: "0.11s", // Block time
  nakamotoCoeff: "19", // Nakamoto Coefficient
  validators: "151", // Validators
};

function parseValue(value: string): number {
  const cleaned = value.replace(/[,<>]/g, "");
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

function MetricBox({
  value,
  label,
  isWinner = false,
  isPrimary = false,
  tooltip = null,
  showConnector = false,
  chainLogo = null,
  chainName = null,
}: {
  value: string;
  label: string;
  isWinner?: boolean;
  isPrimary?: boolean;
  tooltip?: React.ReactNode;
  showConnector?: boolean;
  chainLogo?: string | null;
  chainName?: string | null;
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

        {/* Winner check in top-right corner */}
        {isWinner && (
          <Check className="absolute top-3 right-3 h-4 w-4 text-green-600 dark:text-green-400" />
        )}

        <div className={valueClasses}>{value}</div>
        <div className="font-medium text-sm text-muted-foreground flex items-center justify-center gap-1 leading-relaxed">
          <span className="whitespace-nowrap">{label}</span>
          {tooltip}
        </div>
      </div>
      {showConnector && (
        <div className="absolute top-1/2 -right-3 w-6 h-px bg-border transform -translate-y-1/2 hidden lg:block" />
      )}
    </div>
  );
}

export default function PerformancePage() {
  const [selectedEcosystems, setSelectedEcosystems] = useState<ChainMetric[]>([]);

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
            {/* Sidebar */}
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

            {/* Main Content */}
            <main className="flex-1">
              <div className="mb-8 flex items-start justify-between">
                <h1 className="text-3xl font-bold">
                  {selectedEcosystems.length > 0
                    ? `Aptos vs ${selectedEcosystems.map((e) => e.name).join(" vs ")}`
                    : "Aptos Performance"}
                </h1>

                {/* Chainspect Attribution */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>Data powered by</span>
                  <div className="flex items-center gap-1.5">
                    <Image
                      src="/chainspect_icon_squared.png"
                      alt="Chainspect"
                      width={18}
                      height={18}
                      className="rounded-sm"
                    />
                    <span className="font-medium text-foreground">Chainspect</span>
                  </div>
                </div>
              </div>

              {selectedEcosystems.length > 0 ? (
                <div className="space-y-8">
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
                            value={chain.metrics.maxTps}
                            label="Max TPS (100 blocks)"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.maxTps.includes(chain.name)}
                            showConnector={true}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                          />
                          <MetricBox
                            value={chain.metrics.maxTpsOneBlock}
                            label="Max TPS (1 block)"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.maxTpsOneBlock.includes(chain.name)}
                            showConnector={true}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                          />
                          <MetricBox
                            value={chain.metrics.finality}
                            label="Finality"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.finality.includes(chain.name)}
                            showConnector={true}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                          />
                          <MetricBox
                            value={chain.metrics.blockTime}
                            label="Block Time"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.blockTime.includes(chain.name)}
                            showConnector={true}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                          />
                          <MetricBox
                            value={chain.metrics.nakamotoCoeff}
                            label="Nakamoto"
                            isPrimary={chain.isPrimary}
                            isWinner={metricWinners.nakamotoCoeff.includes(chain.name)}
                            showConnector={true}
                            chainLogo={chain.logo}
                            chainName={chain.name}
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
                            showConnector={false}
                            chainLogo={chain.logo}
                            chainName={chain.name}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <MetricBox
                    value={aptosMetrics.maxTps}
                    label="Max TPS (100 blocks)"
                    isPrimary={true}
                    showConnector={true}
                  />
                  <MetricBox
                    value={aptosMetrics.maxTpsOneBlock}
                    label="Max TPS (1 block)"
                    isPrimary={true}
                    showConnector={true}
                  />
                  <MetricBox
                    value={aptosMetrics.finality}
                    label="Finality"
                    isPrimary={true}
                    showConnector={true}
                  />
                  <MetricBox
                    value={aptosMetrics.blockTime}
                    label="Block Time"
                    isPrimary={true}
                    showConnector={true}
                  />
                  <MetricBox
                    value={aptosMetrics.nakamotoCoeff}
                    label="Nakamoto"
                    isPrimary={true}
                    showConnector={true}
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
                    showConnector={false}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
