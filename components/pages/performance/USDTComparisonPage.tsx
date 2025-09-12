"use client";

import { Check } from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import USDTCostChart from './USDTCostChart';

// USDT transfer cost data
const usdtCosts = [
  { chain: "Aptos", cost: "$0.0001", logo: "/icons/apt.png", isLowest: true },
  { chain: "Ethereum", cost: "$0.0277", logo: "/icons/performance/eth.png", isLowest: false },
  { chain: "BSC", cost: "$0.0026", logo: "/icons/performance/bnb.png", isLowest: false },
  { chain: "Polygon", cost: "$0.0003", logo: "/icons/performance/polygon.png", isLowest: false },
  { chain: "TRON", cost: "$2-4", logo: "/icons/performance/trx.png", isLowest: false },
  { chain: "TON", cost: "$0.0444", logo: "/icons/performance/ton.png", isLowest: false },
  { chain: "Solana", cost: "$0.002-0.12", logo: "/icons/performance/sol.png", isLowest: false },
  { chain: "Avalanche", cost: "$0.0003", logo: "/icons/performance/avax.png", isLowest: false },
  { chain: "Polkadot", cost: "$0.0061", logo: "/icons/performance/polkadot.png", isLowest: false }
].sort((a, b) => {
  // Parse cost for sorting (take the lower bound for ranges)
  const parseUsd = (cost: string) => parseFloat(cost.replace(/[$-].*/, "").replace("$", ""));
  return parseUsd(a.cost) - parseUsd(b.cost);
});

function calculateCostMultiplier(cost: string): string | null {
  const aptosCost = 0.0001; // $0.0001
  
  // Parse the cost string
  let numericCost: number;
  const cleanCost = cost.replace('$', '');
  
  if (cleanCost.includes('-')) {
    // Take the upper bound for ranges (worst case scenario)
    numericCost = parseFloat(cleanCost.split('-')[1]);
  } else {
    numericCost = parseFloat(cleanCost);
  }
  
  if (numericCost === aptosCost) return null;
  
  const multiplier = numericCost / aptosCost;
  return multiplier >= 10 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(1)}x`;
}

export default function USDTComparisonPage() {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === "performance") {
      router.push("/performance");
      return;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 min-h-[calc(100vh-200px)]">
      <div className="flex gap-12">
        {/* Main Content */}
        <main className="w-full">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Aptos is the Most Cost-Effective Chain for USDT
                <Image
                  src="/icons/stables/usdt.png"
                  alt="USDT"
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
            </div>
          </div>

          <Tabs value="usdt" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="performance">Chain Performance</TabsTrigger>
              <TabsTrigger value="usdt">USDT Dominance</TabsTrigger>
            </TabsList>

            <TabsContent value="usdt" className="mt-6">
              <div className="space-y-6">
                {/* Transfer Cost Chart */}
                <div className="flex gap-8 items-stretch">
                  {/* Cost Cards Section */}
                  <div className="w-2/5 flex flex-col">
                    <h3 className="text-xl font-bold mb-6">P2P USDT Transfer Costs</h3>
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      {usdtCosts.map((item, index) => (
                        <div 
                          key={item.chain}
                          className={`text-center p-5 border rounded relative transition-all duration-200 min-h-[120px] flex flex-col justify-center ${
                            item.isLowest ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                          }`}
                        >
                          {/* Chain Logo in top-left corner (except for Aptos) */}
                          {!item.isLowest && (
                            <div className="absolute top-3 left-3">
                              <Image
                                src={item.logo}
                                alt={item.chain}
                                width={16}
                                height={16}
                                className="rounded-sm opacity-60"
                              />
                            </div>
                          )}

                          {/* Winner check in top-right corner */}
                          {item.isLowest && (
                            <Check className="absolute top-3 right-3 h-4 w-4 text-green-600 dark:text-green-400" />
                          )}

                          <div className={`text-xl xl:text-2xl font-bold font-mono mb-3 leading-tight ${item.isLowest ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                            {item.cost}
                          </div>
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="text-xs text-gray-600 dark:text-gray-400 px-1.5 py-1 rounded font-medium flex items-center justify-center gap-1 whitespace-nowrap">
                              <span className="text-xs">{item.chain}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Chart Section */}
                  <div className="w-3/5 flex flex-col">
                    <div className="flex-1 border rounded p-4">
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
  );
}