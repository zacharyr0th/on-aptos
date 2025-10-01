"use client";

import { GeistMono } from "geist/font/mono";
import { AlertTriangle, Check, HelpCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/hooks/useTranslation";
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
    color: "#00D4AA",
  },
  {
    chain: "Ethereum",
    transactions: 1200000,
    logo: "/icons/performance/eth.png",
    color: "#627EEA",
  },
  {
    chain: "BSC",
    transactions: 900000,
    logo: "/icons/performance/bnb.png",
    color: "#F3BA2F",
  },
  {
    chain: "TRON",
    transactions: 1800000,
    logo: "/icons/performance/trx.png",
    color: "#FF060A",
  },
  {
    chain: "Solana",
    transactions: 650000,
    logo: "/icons/performance/sol.png",
    color: "#9945FF",
  },
  {
    chain: "Polygon",
    transactions: 420000,
    logo: "/icons/performance/polygon.png",
    color: "#8247E5",
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

function formatTPS(value: string): string {
  const cleanValue = value.replace(/[,<>]/g, "");
  const num = parseInt(cleanValue);

  if (num < 1000) {
    return num.toString();
  } else if (num < 10000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith(".0") ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
  } else {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith(".0") ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
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
    return minutes * 60 + seconds;
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

// Helper function to truncate text intelligently based on screen size
function getResponsiveText(text: string, multiplier: string, isSmallScreen?: boolean): string {
  if (isSmallScreen) {
    // On small screens, just show the multiplier
    return `${multiplier} better`;
  }

  // Full text for larger screens
  return text;
}

// Helper function to get responsive advantage text
function getResponsiveAdvantageText(
  advantageText: string,
  multiplier: string,
  chainName?: string
): {
  full: string;
  compact: string;
  minimal: string;
} {
  const isAptos = advantageText.includes("Aptos is");

  return {
    full: advantageText,
    compact: isAptos
      ? `Aptos is ${multiplier} better`
      : `${chainName || "Competitor"} is ${multiplier} better`,
    minimal: `${multiplier} better`,
  };
}

function calculatePercentageDifference(
  metric: string,
  aptosValue: string,
  competitorValue: string,
  forAptos: boolean = false,
  competitorName: string = "Competitor"
): {
  multiplier: string;
  fraction: string;
  advantageText: string;
  severity: "moderate" | "severe" | "critical" | "extreme";
} | null {
  const isHigherBetter = ["maxTps", "maxTpsOneBlock", "nakamotoCoeff", "validators"].includes(
    metric
  );
  const aptosNum = parseValue(aptosValue);
  const competitorNum = parseValue(competitorValue);

  if (aptosNum === 0 || competitorNum === 0) return null;

  // Determine who is actually winning
  let aptosIsWinning: boolean;
  if (isHigherBetter) {
    aptosIsWinning = aptosNum > competitorNum;
  } else {
    aptosIsWinning = aptosNum < competitorNum;
  }

  // Always show comparison text now to maintain consistent card sizes

  // Calculate how much better the winner is
  let multiplier: number;
  let winnerName: string;
  let loserName: string;

  if (aptosIsWinning) {
    // Aptos is winning, show on competitor card
    winnerName = "Aptos";
    loserName = competitorName;
    if (isHigherBetter) {
      multiplier = aptosNum / competitorNum; // e.g., 12933 / 926 = 14x
    } else {
      multiplier = competitorNum / aptosNum; // e.g., 57s / 1s = 57x
    }
  } else {
    // Competitor is winning, show on Aptos card
    winnerName = competitorName;
    loserName = "Aptos";
    if (isHigherBetter) {
      multiplier = competitorNum / aptosNum; // e.g., 965 / 151 = 6.4x
    } else {
      multiplier = aptosNum / competitorNum; // e.g., 12.8s / 1s = 12.8x
    }
  }

  const multiplierText =
    multiplier >= 10 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(1)}x`;

  // Create fraction text
  const fractionText =
    multiplier >= 10
      ? `1/${Math.round(multiplier)}`
      : `1/${multiplier.toFixed(1).replace(".0", "")}`;

  // Create advantage text
  const advantageText = `${winnerName} is ${multiplierText} better`;

  // Determine severity based on multiplier
  let severity: "moderate" | "severe" | "critical" | "extreme";
  if (multiplier < 10) {
    severity = "moderate";
  } else if (multiplier < 100) {
    severity = "severe";
  } else if (multiplier < 1000) {
    severity = "critical";
  } else {
    severity = "extreme";
  }

  return { multiplier: multiplierText, fraction: fractionText, advantageText, severity };
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
  t,
}: {
  value: string;
  label: string | React.ReactNode;
  isWinner?: boolean;
  isPrimary?: boolean;
  tooltip?: React.ReactNode;
  chainLogo?: string | null;
  chainName?: string | null;
  percentageDifference?: {
    multiplier: string;
    fraction: string;
    advantageText: string;
    severity: "moderate" | "severe" | "critical" | "extreme";
  } | null;
  t: (key: string, fallback: string) => string;
}) {
  const baseClasses =
    "text-center p-3 sm:p-4 lg:p-5 border rounded relative transition-all duration-200 min-h-[120px] sm:min-h-[140px] flex flex-col justify-center overflow-hidden";

  // Determine card styling based on performance
  let cardClasses = "";
  let valueTextClasses = "";
  const badgeElement = null;

  if (isWinner) {
    cardClasses = "border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5";
    valueTextClasses = "text-emerald-800 dark:text-emerald-500";
  } else if (percentageDifference) {
    const { severity } = percentageDifference;

    switch (severity) {
      case "moderate":
        cardClasses = "border-amber-300 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/5";
        valueTextClasses = "text-amber-800 dark:text-amber-600";
        break;
      case "severe":
        cardClasses = "border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5";
        valueTextClasses = "text-orange-800 dark:text-orange-600";
        break;
      case "critical":
        cardClasses = "border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5";
        valueTextClasses = "text-red-800 dark:text-red-600";
        break;
      case "extreme":
        cardClasses = "border-red-500 bg-red-100 dark:border-red-700/40 dark:bg-red-950/5";
        valueTextClasses = "text-red-900 dark:text-red-600";
        break;
    }
  }

  const finalValueClasses = isPrimary
    ? `text-lg sm:text-xl xl:text-2xl font-bold font-mono mb-1 sm:mb-2 leading-tight break-words ${isWinner ? valueTextClasses : "text-primary"}`
    : `text-lg sm:text-xl xl:text-2xl font-bold font-mono mb-1 sm:mb-2 leading-tight break-words ${percentageDifference ? valueTextClasses : isWinner ? valueTextClasses : "text-muted-foreground"}`;

  // Get responsive advantage text
  const advantageTextVariants = percentageDifference
    ? getResponsiveAdvantageText(
        percentageDifference.advantageText,
        percentageDifference.multiplier,
        chainName
      )
    : null;

  return (
    <div className="relative">
      <div className={`${baseClasses} ${cardClasses}`}>
        {/* Chain Logo in top-left corner */}
        {chainLogo && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            {chainLogo.startsWith("/") ? (
              <Image
                src={chainLogo}
                alt={chainName || ""}
                width={20}
                height={20}
                className={`sm:w-6 sm:h-6 rounded-sm opacity-60 ${chainLogo.includes("/apt.png") ? "dark:invert" : ""}`}
              />
            ) : (
              <span className="text-lg sm:text-xl opacity-60">{chainLogo}</span>
            )}
          </div>
        )}

        {/* Winner check in top-right corner */}
        {isWinner && (
          <Check className="absolute top-2 right-2 sm:top-3 sm:right-3 h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
        )}

        <div className={finalValueClasses}>{value}</div>
        <div className="font-medium text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1 leading-relaxed">
          {typeof label === 'string' ? (
            <span className="truncate max-w-full px-1">{label}</span>
          ) : (
            <div className="px-1">{label}</div>
          )}
          {tooltip}
        </div>
        {advantageTextVariants && !isPrimary && (
          <div className="text-xs text-muted-foreground mt-1 font-medium px-1">
            {/* Check if this is equivalent performance */}
            {percentageDifference && parseFloat(percentageDifference.multiplier.replace('x', '')) === 1.0 ? (
              <div className="flex items-center justify-center gap-1">
                <span>{t("comparison.same_as", "Same as")}</span>
                <Image
                  src="/icons/apt.png"
                  alt="Aptos"
                  width={16}
                  height={16}
                  className="dark:invert"
                />
              </div>
            ) : (
              <>
                {/* Full text for large screens */}
                <div className="hidden lg:block">
                  {advantageTextVariants.full.includes("Aptos is") ? (
                    <div className="flex items-center justify-center gap-1">
                      <Image
                        src="/icons/apt.png"
                        alt="Aptos"
                        width={12}
                        height={12}
                        className="dark:invert"
                      />
                      <span>{t("comparison.is_better", "is")}</span>
                      <span className="font-bold text-primary">{percentageDifference!.multiplier}</span>
                      <span>{t("comparison.better", "better")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Image
                        src={chainLogo || "/icons/apt.png"}
                        alt={chainName || "Chain"}
                        width={12}
                        height={12}
                        className={`${chainLogo?.includes("/apt.png") ? "dark:invert" : ""}`}
                      />
                      <span>{t("comparison.is_better", "is")}</span>
                      <span className="font-bold text-primary">{percentageDifference!.multiplier}</span>
                      <span>{t("comparison.better", "better")}</span>
                    </div>
                  )}
                </div>
                {/* Compact text for medium screens */}
                <div className="hidden sm:block lg:hidden">
                  <div className="flex items-center justify-center gap-1">
                    <Image
                      src="/icons/apt.png"
                      alt="Aptos"
                      width={12}
                      height={12}
                      className="dark:invert"
                    />
                    <span className="font-bold text-primary">{percentageDifference!.multiplier}</span>
                    <span>{t("comparison.better", "better")}</span>
                  </div>
                </div>
                {/* Minimal text for small screens */}
                <div className="block sm:hidden">
                  {advantageTextVariants.full.includes("Aptos is") ? (
                    <div className="flex items-center justify-center gap-1">
                      <Image
                        src="/icons/apt.png"
                        alt="Aptos"
                        width={12}
                        height={12}
                        className="dark:invert"
                      />
                      <span>{t("comparison.is_better", "is")}</span>
                      <span className="font-bold text-primary">{percentageDifference!.multiplier}</span>
                      <span>{t("comparison.better", "better")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Image
                        src={chainLogo || "/icons/apt.png"}
                        alt={chainName || "Chain"}
                        width={12}
                        height={12}
                        className={`${chainLogo?.includes("/apt.png") ? "dark:invert" : ""}`}
                      />
                      <span>{t("comparison.is_better", "is")}</span>
                      <span className="font-bold text-primary">{percentageDifference!.multiplier}</span>
                      <span>{t("comparison.better", "better")}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("performance");
  const [selectedEcosystems, setSelectedEcosystems] = useState<ChainMetric[]>(() => {
    // Set default comparisons: Sui, TRON, and Base
    return ecosystems.filter(
      (ecosystem) =>
        ecosystem.name === "Sui" || ecosystem.name === "TRON" || ecosystem.name === "Base"
    );
  });
  const router = useRouter();
  const { t } = useTranslation("performance");
  const { t: tCommon } = useTranslation("common");

  // Safe translation function to prevent SSR errors
  const safeT = (key: string, fallback: string) => {
    if (typeof t === 'function') {
      return t(key, fallback);
    }
    return fallback;
  };

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
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4">
          <div className="flex gap-12">
            {/* Sidebar - only show for performance tab */}
            {activeTab === "performance" && (
              <aside className="hidden lg:block lg:w-48 lg:flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {t("sidebar.compare_count", "Compare ({{count}}/3)", {
                      count: selectedEcosystems.length
                    })}
                  </h2>
                  {selectedEcosystems.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t("sidebar.clear", "Clear")}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {ecosystems.map((ecosystem) => {
                    const isSelected = selectedEcosystems.some((e) => e.name === ecosystem.name);
                    const canSelect = selectedEcosystems.length < 3 || isSelected;

                    return (
                      <button
                        key={ecosystem.name}
                        onClick={() => toggleEcosystem(ecosystem)}
                        disabled={!canSelect}
                        className={`w-full text-left p-4 rounded transition-colors ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
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
                              className={`rounded-sm ${ecosystem.logo.includes("/apt.png") ? "dark:invert" : ""}`}
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
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
                      {selectedEcosystems.length > 0
                        ? t("page.title_vs", "Aptos vs {{chains}}", {
                            chains: selectedEcosystems.map((e) => e.name).join(" vs ")
                          })
                        : t("page.title", "Aptos Performance")}
                    </h1>
                  </div>

                  {/* Data Attribution */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap">{t("attribution.data_powered_by", "Data powered by")}</span>
                      <a
                        href="https://chainspect.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Image
                          src="/chainspect_icon_squared.png"
                          alt="Chainspect"
                          width={16}
                          height={16}
                          className="sm:w-[18px] sm:h-[18px] rounded-sm flex-shrink-0"
                        />
                        <span className="font-medium text-foreground whitespace-nowrap">
                          {t("attribution.chainspect", "Chainspect")}
                        </span>
                      </a>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">
                            {t("tooltips.chainspect_data", "Chainspect does not have an API so these values were hardcoded on September 11th, 2025.")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="performance" className="text-xs sm:text-sm px-2 sm:px-3">
                    <span className="hidden sm:inline">{t("tabs.performance", "Chain Performance")}</span>
                    <span className="sm:hidden">{t("tabs.performance_short", "Performance")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="usdt" className="text-xs sm:text-sm px-2 sm:px-3">
                    <span className="hidden sm:inline">{t("tabs.usdt", "USDt Comparison")}</span>
                    <span className="sm:hidden">{t("tabs.usdt_short", "USDt")}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-6">
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
                          ...selectedEcosystems.map((e) => ({
                            name: e.name,
                            value: e.metrics.maxTps,
                          })),
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                              <MetricBox
                                value={formatTPS(chain.metrics.maxTps)}
                                label={t("metrics.max_tps_100_blocks", "Max TPS (100 blocks)")}
                                isPrimary={chain.isPrimary}
                                isWinner={metricWinners.maxTps.includes(chain.name)}
                                chainLogo={chain.logo}
                                t={safeT}
                                chainName={chain.name}
                                percentageDifference={(() => {
                                  if (chain.isPrimary) {
                                    // For Aptos cards, find the best competitor and compare against them
                                    const winner = selectedEcosystems.find((e) =>
                                      metricWinners.maxTps.includes(e.name)
                                    );
                                    if (winner) {
                                      return calculatePercentageDifference(
                                        "maxTps",
                                        aptosMetrics.maxTps,
                                        winner.metrics.maxTps,
                                        true,
                                        winner.name
                                      );
                                    } else {
                                      // If Aptos is winning, compare against the best competitor
                                      const bestCompetitor = selectedEcosystems.reduce(
                                        (best, current) => {
                                          const bestVal = parseValue(best.metrics.maxTps);
                                          const currentVal = parseValue(current.metrics.maxTps);
                                          return currentVal > bestVal ? current : best;
                                        }
                                      );
                                      return calculatePercentageDifference(
                                        "maxTps",
                                        aptosMetrics.maxTps,
                                        bestCompetitor.metrics.maxTps,
                                        false,
                                        bestCompetitor.name
                                      );
                                    }
                                  } else {
                                    // For competitor cards, always compare against Aptos
                                    return calculatePercentageDifference(
                                      "maxTps",
                                      aptosMetrics.maxTps,
                                      chain.metrics.maxTps,
                                      false,
                                      chain.name
                                    );
                                  }
                                })()}
                              />
                              <MetricBox
                                value={formatTPS(chain.metrics.maxTpsOneBlock)}
                                label={t("metrics.max_tps_1_block", "Max TPS (1 block)")}
                                isPrimary={chain.isPrimary}
                                isWinner={metricWinners.maxTpsOneBlock.includes(chain.name)}
                                chainLogo={chain.logo}
                                t={safeT}
                                chainName={chain.name}
                                percentageDifference={(() => {
                                  if (chain.isPrimary) {
                                    const winner = selectedEcosystems.find((e) =>
                                      metricWinners.maxTpsOneBlock.includes(e.name)
                                    );
                                    if (winner) {
                                      return calculatePercentageDifference(
                                        "maxTpsOneBlock",
                                        aptosMetrics.maxTpsOneBlock,
                                        winner.metrics.maxTpsOneBlock,
                                        true,
                                        winner.name
                                      );
                                    } else {
                                      const bestCompetitor = selectedEcosystems.reduce(
                                        (best, current) => {
                                          const bestVal = parseValue(best.metrics.maxTpsOneBlock);
                                          const currentVal = parseValue(
                                            current.metrics.maxTpsOneBlock
                                          );
                                          return currentVal > bestVal ? current : best;
                                        }
                                      );
                                      return calculatePercentageDifference(
                                        "maxTpsOneBlock",
                                        aptosMetrics.maxTpsOneBlock,
                                        bestCompetitor.metrics.maxTpsOneBlock,
                                        false,
                                        bestCompetitor.name
                                      );
                                    }
                                  } else {
                                    return calculatePercentageDifference(
                                      "maxTpsOneBlock",
                                      aptosMetrics.maxTpsOneBlock,
                                      chain.metrics.maxTpsOneBlock,
                                      false,
                                      chain.name
                                    );
                                  }
                                })()}
                              />
                              <MetricBox
                                value={chain.metrics.finality}
                                label={t("metrics.finality", "Finality")}
                                isPrimary={chain.isPrimary}
                                isWinner={metricWinners.finality.includes(chain.name)}
                                chainLogo={chain.logo}
                                t={safeT}
                                chainName={chain.name}
                                percentageDifference={(() => {
                                  if (chain.isPrimary) {
                                    const winner = selectedEcosystems.find((e) =>
                                      metricWinners.finality.includes(e.name)
                                    );
                                    if (winner) {
                                      return calculatePercentageDifference(
                                        "finality",
                                        aptosMetrics.finality,
                                        winner.metrics.finality,
                                        true,
                                        winner.name
                                      );
                                    } else {
                                      const bestCompetitor = selectedEcosystems.reduce(
                                        (best, current) => {
                                          const bestVal = parseValue(best.metrics.finality);
                                          const currentVal = parseValue(current.metrics.finality);
                                          return currentVal < bestVal ? current : best;
                                        }
                                      );
                                      return calculatePercentageDifference(
                                        "finality",
                                        aptosMetrics.finality,
                                        bestCompetitor.metrics.finality,
                                        false,
                                        bestCompetitor.name
                                      );
                                    }
                                  } else {
                                    return calculatePercentageDifference(
                                      "finality",
                                      aptosMetrics.finality,
                                      chain.metrics.finality,
                                      false,
                                      chain.name
                                    );
                                  }
                                })()}
                              />
                              <MetricBox
                                value={chain.metrics.blockTime}
                                label={t("metrics.block_time", "Block Time")}
                                isPrimary={chain.isPrimary}
                                isWinner={metricWinners.blockTime.includes(chain.name)}
                                chainLogo={chain.logo}
                                t={safeT}
                                chainName={chain.name}
                                percentageDifference={(() => {
                                  if (chain.isPrimary) {
                                    const winner = selectedEcosystems.find((e) =>
                                      metricWinners.blockTime.includes(e.name)
                                    );
                                    if (winner) {
                                      return calculatePercentageDifference(
                                        "blockTime",
                                        aptosMetrics.blockTime,
                                        winner.metrics.blockTime,
                                        true,
                                        winner.name
                                      );
                                    } else {
                                      const bestCompetitor = selectedEcosystems.reduce(
                                        (best, current) => {
                                          const bestVal = parseValue(best.metrics.blockTime);
                                          const currentVal = parseValue(current.metrics.blockTime);
                                          return currentVal < bestVal ? current : best;
                                        }
                                      );
                                      return calculatePercentageDifference(
                                        "blockTime",
                                        aptosMetrics.blockTime,
                                        bestCompetitor.metrics.blockTime,
                                        false,
                                        bestCompetitor.name
                                      );
                                    }
                                  } else {
                                    return calculatePercentageDifference(
                                      "blockTime",
                                      aptosMetrics.blockTime,
                                      chain.metrics.blockTime,
                                      false,
                                      chain.name
                                    );
                                  }
                                })()}
                              />
                              <MetricBox
                                value={chain.metrics.nakamotoCoeff}
                                label={t("metrics.nakamoto", "Nakamoto")}
                                isPrimary={chain.isPrimary}
                                isWinner={metricWinners.nakamotoCoeff.includes(chain.name)}
                                chainLogo={chain.logo}
                                t={safeT}
                                chainName={chain.name}
                                percentageDifference={(() => {
                                  if (chain.isPrimary) {
                                    const winner = selectedEcosystems.find((e) =>
                                      metricWinners.nakamotoCoeff.includes(e.name)
                                    );
                                    if (winner) {
                                      return calculatePercentageDifference(
                                        "nakamotoCoeff",
                                        aptosMetrics.nakamotoCoeff,
                                        winner.metrics.nakamotoCoeff,
                                        true,
                                        winner.name
                                      );
                                    } else {
                                      const bestCompetitor = selectedEcosystems.reduce(
                                        (best, current) => {
                                          const bestVal = parseValue(best.metrics.nakamotoCoeff);
                                          const currentVal = parseValue(
                                            current.metrics.nakamotoCoeff
                                          );
                                          return currentVal > bestVal ? current : best;
                                        }
                                      );
                                      return calculatePercentageDifference(
                                        "nakamotoCoeff",
                                        aptosMetrics.nakamotoCoeff,
                                        bestCompetitor.metrics.nakamotoCoeff,
                                        false,
                                        bestCompetitor.name
                                      );
                                    }
                                  } else {
                                    return calculatePercentageDifference(
                                      "nakamotoCoeff",
                                      aptosMetrics.nakamotoCoeff,
                                      chain.metrics.nakamotoCoeff,
                                      false,
                                      chain.name
                                    );
                                  }
                                })()}
                                tooltip={
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm max-w-xs">
                                        {t("tooltips.nakamoto_coefficient", "Minimum entities needed to control >50% of network resources. Higher = more decentralized.")}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                }
                              />
                              <MetricBox
                                value={chain.metrics.validators}
                                label={t("metrics.validators", "Validators")}
                                isPrimary={chain.isPrimary}
                                isWinner={metricWinners.validators.includes(chain.name)}
                                chainLogo={chain.logo}
                                t={safeT}
                                chainName={chain.name}
                                percentageDifference={(() => {
                                  if (chain.isPrimary) {
                                    const winner = selectedEcosystems.find((e) =>
                                      metricWinners.validators.includes(e.name)
                                    );
                                    if (winner) {
                                      return calculatePercentageDifference(
                                        "validators",
                                        aptosMetrics.validators,
                                        winner.metrics.validators,
                                        true,
                                        winner.name
                                      );
                                    } else {
                                      const bestCompetitor = selectedEcosystems.reduce(
                                        (best, current) => {
                                          const bestVal = parseValue(best.metrics.validators);
                                          const currentVal = parseValue(current.metrics.validators);
                                          return currentVal > bestVal ? current : best;
                                        }
                                      );
                                      return calculatePercentageDifference(
                                        "validators",
                                        aptosMetrics.validators,
                                        bestCompetitor.metrics.validators,
                                        false,
                                        bestCompetitor.name
                                      );
                                    }
                                  } else {
                                    return calculatePercentageDifference(
                                      "validators",
                                      aptosMetrics.validators,
                                      chain.metrics.validators,
                                      false,
                                      chain.name
                                    );
                                  }
                                })()}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <MetricBox
                        value={formatTPS(aptosMetrics.maxTps)}
                        label={t("metrics.max_tps_100_blocks", "Max TPS (100 blocks)")}
                        isPrimary={true}
                        t={safeT}
                      />
                      <MetricBox
                        value={formatTPS(aptosMetrics.maxTpsOneBlock)}
                        label={t("metrics.max_tps_1_block", "Max TPS (1 block)")}
                        isPrimary={true}
                        t={safeT}
                      />
                      <MetricBox value={aptosMetrics.finality} label={t("metrics.finality", "Finality")} isPrimary={true} t={t} />
                      <MetricBox
                        value={aptosMetrics.blockTime}
                        label={t("metrics.block_time", "Block Time")}
                        isPrimary={true}
                        t={safeT}
                      />
                      <MetricBox
                        value={aptosMetrics.nakamotoCoeff}
                        label={t("metrics.nakamoto", "Nakamoto")}
                        isPrimary={true}
                        t={safeT}
                        tooltip={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm max-w-xs">
                                {t("tooltips.nakamoto_coefficient", "Minimum entities needed to control >50% of network resources. Higher = more decentralized.")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        }
                      />
                      <MetricBox
                        value={aptosMetrics.validators}
                        label={t("metrics.validators", "Validators")}
                        isPrimary={true}
                        t={safeT}
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
