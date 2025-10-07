"use client";

import { GeistMono } from "geist/font/mono";
import { AlertTriangle, Check, HelpCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import USDTCostChart from "./USDTCostChart";

// USDT transfer cost data - moved outside component for better performance
const rawUsdtCosts = [
  { chain: "Aptos", cost: "$0.0001", logo: "/icons/apt.png", isLowest: true },
  { chain: "Ethereum", cost: "$0.0277", logo: "/icons/performance/eth.png", isLowest: false },
  { chain: "BNB Chain", cost: "$0.0026", logo: "/icons/performance/bnb.png", isLowest: false },
  { chain: "Polygon", cost: "$0.0003", logo: "/icons/performance/polygon.png", isLowest: false },
  { chain: "TRON", cost: "$2-4", logo: "/icons/performance/trx.png", isLowest: false },
  { chain: "TON", cost: "$0.0444", logo: "/icons/performance/ton.png", isLowest: false },
  { chain: "Solana", cost: "$0.002-0.12", logo: "/icons/performance/sol.png", isLowest: false },
  { chain: "Avalanche", cost: "$0.0003", logo: "/icons/performance/avax.png", isLowest: false },
  { chain: "Polkadot", cost: "$0.0061", logo: "/icons/performance/polkadot.png", isLowest: false },
];

// Pre-calculate sorted costs at module level
const parseUsd = (cost: string) => parseFloat(cost.replace(/[$-].*/, "").replace("$", ""));
const usdtCosts = rawUsdtCosts.sort((a, b) => parseUsd(a.cost) - parseUsd(b.cost));

// Memoize multiplier calculations at module level
const multiplierCache = new Map<
  string,
  { multiplier: string; severity: "moderate" | "severe" | "critical" | "extreme" } | null
>();

function calculateCostMultiplier(
  cost: string
): { multiplier: string; severity: "moderate" | "severe" | "critical" | "extreme" } | null {
  if (multiplierCache.has(cost)) {
    return multiplierCache.get(cost)!;
  }
  const aptosCost = 0.0001; // $0.0001

  // Parse the cost string
  let numericCost: number;
  let multiplierText: string;

  // Handle custom multipliers for specific chains
  if (cost === "$2-4") {
    // TRON - custom multiplier
    multiplierText = "Up to 40,000x";
    numericCost = 4; // Use upper bound for severity calculation
  } else if (cost === "$0.002-0.12") {
    // Solana - custom multiplier
    multiplierText = "Up to 1,200x";
    numericCost = 0.12; // Use upper bound for severity calculation
  } else {
    const cleanCost = cost.replace("$", "");

    if (cleanCost.includes("-")) {
      // Take the upper bound for ranges (worst case scenario)
      numericCost = parseFloat(cleanCost.split("-")[1]);
    } else {
      numericCost = parseFloat(cleanCost);
    }

    if (numericCost === aptosCost) return null;

    const multiplier = numericCost / aptosCost;
    // Remove .0 from multiplier text for cleaner display
    if (multiplier >= 10 && multiplier % 1 === 0) {
      multiplierText = `${Math.round(multiplier)}x`;
    } else if (multiplier >= 10) {
      multiplierText = `${Math.round(multiplier)}x`;
    } else {
      const decimal = multiplier.toFixed(1);
      multiplierText = decimal.endsWith(".0") ? `${Math.round(multiplier)}x` : `${decimal}x`;
    }
  }

  if (numericCost === aptosCost) return null;

  const multiplier = numericCost / aptosCost;

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

  const result = { multiplier: multiplierText, severity };
  multiplierCache.set(cost, result);
  return result;
}

const USDTComparisonPage = memo(function USDTComparisonPage() {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === "performance") {
      router.push("/performance");
      return;
    }
  };

  // Memoize the expensive card calculations
  const costCards = useMemo(() => {
    return usdtCosts.map((item, index) => {
      const costComparison = item.isLowest ? null : calculateCostMultiplier(item.cost);

      // Determine card styling based on performance
      let cardClasses = "";
      let valueTextClasses = "";
      let badgeElement = null;

      if (item.isLowest) {
        cardClasses =
          "border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5";
        valueTextClasses = "text-emerald-800 dark:text-emerald-500";
      } else if (costComparison) {
        const { multiplier, severity } = costComparison;

        switch (severity) {
          case "moderate":
            cardClasses =
              "border-amber-300 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/5";
            valueTextClasses = "text-amber-800 dark:text-amber-600";
            badgeElement = (
              <div className="bg-amber-200 dark:bg-amber-900/20 text-amber-900 dark:text-amber-500 px-1.5 py-0.5 rounded text-xs font-medium">
                {multiplier}
              </div>
            );
            break;
          case "severe":
            cardClasses =
              "border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5";
            valueTextClasses = "text-orange-800 dark:text-orange-600";
            badgeElement = (
              <div className="bg-orange-200 dark:bg-orange-900/20 text-orange-900 dark:text-orange-500 px-1.5 py-0.5 rounded text-xs font-medium">
                {multiplier}
              </div>
            );
            break;
          case "critical":
            cardClasses = "border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5";
            valueTextClasses = "text-red-800 dark:text-red-600";
            badgeElement = (
              <div className="bg-red-200 dark:bg-red-900/20 text-red-900 dark:text-red-500 px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {multiplier}
              </div>
            );
            break;
          case "extreme":
            cardClasses = "border-red-500 bg-red-100 dark:border-red-700/40 dark:bg-red-950/5";
            valueTextClasses = "text-red-900 dark:text-red-600";
            badgeElement = (
              <div className="bg-red-300 dark:bg-red-800/20 text-red-900 dark:text-red-500 px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {multiplier}
              </div>
            );
            break;
        }
      }

      return {
        item,
        cardClasses,
        valueTextClasses,
        badgeElement,
      };
    });
  }, []);

  return (
    <div className={`${GeistMono.className}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4">
        <div className="flex gap-12">
          {/* Main Content */}
          <main className="w-full">
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">
                    {/* Desktop version */}
                    <div className="hidden sm:flex items-center gap-3">
                      <span className="break-words">
                        Aptos is the Most Cost-Effective Blockchain for USDt
                      </span>
                      <Image
                        src="/icons/stables/usdt.png"
                        alt="USDt"
                        width={32}
                        height={32}
                        className="rounded-sm flex-shrink-0"
                      />
                    </div>
                    {/* Mobile version */}
                    <div className="sm:hidden">
                      <span className="break-words">
                        Aptos is Most Cost-Effective Blockchain for P2P USDt Transfers
                      </span>
                    </div>
                  </h1>
                </div>

                {/* Data Attribution */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap">Data powered by</span>
                    <a
                      href="https://gasfeesnow.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <span className="font-medium text-foreground">GasFeesNow</span>
                    </a>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">
                          GasFeesNow does not have an API so these values were hardcoded on
                          September 12th, 2025.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <Tabs value="usdt" onValueChange={handleTabChange} className="w-full">
              <TabsContent value="usdt" className="mt-6">
                <div>
                  {/* Transfer Cost Chart */}
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 lg:items-stretch lg:h-[70vh]">
                    {/* Chart Section */}
                    <div className="hidden sm:flex w-full lg:w-3/5 flex-col order-1 lg:order-2">
                      <div className="flex-1 min-h-[350px] lg:min-h-[600px] h-auto pb-4 lg:pb-0">
                        <USDTCostChart data={usdtCosts} />
                      </div>
                    </div>

                    {/* Cost Cards Section */}
                    <div className="w-full lg:w-2/5 flex flex-col order-2 lg:order-1">
                      {/* Tabs positioned above cards only */}
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger
                          value="performance"
                          className="text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <span className="hidden sm:inline">Chain Performance</span>
                          <span className="sm:hidden">Performance</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="usdt"
                          className="text-xs sm:text-sm px-2 sm:px-3 flex items-center gap-1"
                        >
                          <span className="hidden sm:inline">USDt Comparison</span>
                          <span className="sm:hidden flex items-center gap-1">
                            <Image
                              src="/icons/stables/usdt.png"
                              alt="USDt"
                              width={14}
                              height={14}
                              className="rounded-sm"
                            />
                            Costs
                          </span>
                        </TabsTrigger>
                      </TabsList>
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1">
                        {costCards.map(({ item, cardClasses, valueTextClasses, badgeElement }) => (
                          <div
                            key={item.chain}
                            className={`text-center p-2 sm:p-3 lg:p-4 border rounded relative transition-all duration-200 min-h-[90px] sm:min-h-[110px] lg:min-h-[130px] flex flex-col justify-center overflow-hidden shadow-sm hover:shadow-md ${cardClasses}`}
                          >
                            {/* Chain Logo in top-left corner */}
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                              <Image
                                src={item.logo}
                                alt={item.chain}
                                width={18}
                                height={18}
                                className={`sm:w-6 sm:h-6 rounded-sm ${item.isLowest ? "opacity-80" : "opacity-60"} ${item.logo.includes("/apt.png") ? "dark:invert" : ""}`}
                              />
                            </div>

                            {/* Winner check in top-right corner */}
                            {item.isLowest && (
                              <Check className="absolute top-2 right-2 sm:top-3 sm:right-3 h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                            )}

                            <div
                              className={`text-lg sm:text-xl xl:text-2xl font-bold font-mono mb-1 sm:mb-2 leading-tight break-words ${item.isLowest ? "text-primary" : valueTextClasses || "text-muted-foreground"}`}
                            >
                              {item.cost}
                            </div>

                            <div className="font-medium text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1 leading-relaxed">
                              <span className="truncate max-w-full px-1">{item.chain}</span>
                            </div>

                            {/* Badge below the chain name */}
                            {badgeElement && (
                              <div className="mt-1 flex justify-center">{badgeElement}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
});

export default USDTComparisonPage;
