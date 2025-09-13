"use client";

import { GeistMono } from "geist/font/mono";
import { Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMemo, memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import USDTCostChart from './USDTCostChart';

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
  { chain: "Polkadot", cost: "$0.0061", logo: "/icons/performance/polkadot.png", isLowest: false }
];

// Pre-calculate sorted costs at module level
const parseUsd = (cost: string) => parseFloat(cost.replace(/[$-].*/, "").replace("$", ""));
const usdtCosts = rawUsdtCosts.sort((a, b) => parseUsd(a.cost) - parseUsd(b.cost));

// Memoize multiplier calculations at module level
const multiplierCache = new Map<string, { multiplier: string; severity: 'moderate' | 'severe' | 'critical' | 'extreme' } | null>();

function calculateCostMultiplier(cost: string): { multiplier: string; severity: 'moderate' | 'severe' | 'critical' | 'extreme' } | null {
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
    const cleanCost = cost.replace('$', '');
    
    if (cleanCost.includes('-')) {
      // Take the upper bound for ranges (worst case scenario)
      numericCost = parseFloat(cleanCost.split('-')[1]);
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
      multiplierText = decimal.endsWith('.0') ? `${Math.round(multiplier)}x` : `${decimal}x`;
    }
  }
  
  if (numericCost === aptosCost) return null;
  
  const multiplier = numericCost / aptosCost;
  
  // Determine severity based on multiplier
  let severity: 'moderate' | 'severe' | 'critical' | 'extreme';
  if (multiplier < 10) {
    severity = 'moderate';
  } else if (multiplier < 100) {
    severity = 'severe';
  } else if (multiplier < 1000) {
    severity = 'critical';
  } else {
    severity = 'extreme';
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
        cardClasses = "border-green-500 bg-green-50 dark:bg-green-950/20";
        valueTextClasses = "text-green-600 dark:text-green-400";
      } else if (costComparison) {
        const { multiplier, severity } = costComparison;
        
        switch (severity) {
          case 'moderate':
            cardClasses = "border-orange-400 bg-orange-50 dark:bg-orange-950/20";
            valueTextClasses = "text-orange-700 dark:text-orange-300";
            badgeElement = (
              <div className="bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 px-1.5 py-0.5 rounded text-xs font-medium">
                {multiplier}
              </div>
            );
            break;
          case 'severe':
            cardClasses = "border-red-400 bg-red-50 dark:bg-red-950/20";
            valueTextClasses = "text-red-700 dark:text-red-300";
            badgeElement = (
              <div className="bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded text-xs font-medium">
                {multiplier}
              </div>
            );
            break;
          case 'critical':
            cardClasses = "border-red-600 bg-red-100 dark:bg-red-900/30";
            valueTextClasses = "text-red-800 dark:text-red-200";
            badgeElement = (
              <div className="bg-red-300 dark:bg-red-700/70 text-red-900 dark:text-red-100 px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {multiplier}
              </div>
            );
            break;
          case 'extreme':
            cardClasses = "border-red-800 bg-red-200 dark:bg-red-900/50";
            valueTextClasses = "text-red-900 dark:text-red-100";
            badgeElement = (
              <div className="bg-red-600 dark:bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
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
        badgeElement
      };
    });
  }, []);

  return (
    <div className={`${GeistMono.className}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4">
      <div className="flex gap-12">
        {/* Main Content */}
        <main className="w-full">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Aptos is the Most Cost-Effective Chain for USDt
                <Image
                  src="/icons/stables/usdt.png"
                  alt="USDt"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
              </h1>
            </div>

            {/* Data Attribution */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>Data powered by</span>
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
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">
                    GasFeesNow does not have an API so these values were hardcoded on September 12th, 2025.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Tabs value="usdt" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="performance">Chain Performance</TabsTrigger>
              <TabsTrigger value="usdt">USDt Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="usdt" className="mt-6">
              <div>
                {/* Transfer Cost Chart */}
                <div className="flex gap-12 items-stretch h-[70vh]">
                  {/* Cost Cards Section */}
                  <div className="w-2/5 flex flex-col">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      {costCards.map(({ item, cardClasses, valueTextClasses, badgeElement }) => (
                        <div 
                          key={item.chain}
                          className={`text-center p-6 border rounded-lg relative transition-all duration-200 min-h-[180px] flex flex-col justify-center ${cardClasses}`}
                        >
                          {/* Chain Logo in top-left corner */}
                          <div className="absolute top-3 left-3">
                            <Image
                              src={item.logo}
                              alt={item.chain}
                              width={24}
                              height={24}
                              className={`rounded-sm ${item.isLowest ? 'opacity-80' : 'opacity-60'} ${item.logo.includes('/apt.png') ? 'dark:invert' : ''}`}
                            />
                          </div>

                          {/* Winner check or severity badge in top-right corner */}
                          {item.isLowest ? (
                            <Check className="absolute top-3 right-3 h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : badgeElement ? (
                            <div className="absolute top-3 right-3">
                              {badgeElement}
                            </div>
                          ) : null}

                          <div className={`${item.chain === 'Solana' ? 'text-xl xl:text-2xl' : 'text-2xl xl:text-3xl'} font-bold font-mono mb-3 leading-tight ${valueTextClasses || "text-foreground"}`}>
                            {item.cost}
                          </div>
                          <div className="font-medium text-base text-muted-foreground flex items-center justify-center gap-1 leading-relaxed">
                            <span className="whitespace-nowrap">{item.chain}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Chart Section */}
                  <div className="w-3/5 flex flex-col">
                    <div className="flex-1 min-h-[600px]">
                      <USDTCostChart data={usdtCosts} />
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