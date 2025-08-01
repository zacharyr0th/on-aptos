import { Activity, Twitter, Github, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";

export const DashboardPreview = () => {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    stablecoins: "$0",
    bitcoin: "$0",
    rwas: "$0",
    defi: "$0",
  });
  const [defiTvl, setDefiTvl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stablecoins data
        const stablesResponse = await fetch("/api/aptos/stables");
        if (stablesResponse.ok) {
          const stablesData = await stablesResponse.json();
          // Use the supplies from the data object
          // Use the pre-calculated total from the API
          const totalValue = parseInt(stablesData.data?.total || "0");
          setTotals((prev) => ({
            ...prev,
            stablecoins: formatAmount(totalValue),
          }));
        }

        // Fetch Bitcoin data
        const btcResponse = await fetch("/api/aptos/btc");
        if (btcResponse.ok) {
          const btcResponseData = await btcResponse.json();
          const btcData = btcResponseData.data;

          // Fetch current BTC price
          const btcPriceResponse = await fetch(
            "/api/analytics/token-latest-price?address=btc",
          );
          let btcPrice = 100000; // fallback price
          if (btcPriceResponse.ok) {
            const priceData = await btcPriceResponse.json();
            btcPrice = priceData.data?.[0]?.price || btcPrice;
          }

          // Use the pre-calculated total BTC from the API
          const totalBTC = parseFloat(btcData?.total || "0");
          const totalBtcValue = totalBTC * btcPrice;
          setTotals((prev) => ({
            ...prev,
            bitcoin: formatAmount(totalBtcValue),
          }));
        }

        // Fetch RWA data
        const rwaResponse = await fetch("/api/aptos/rwa");
        if (rwaResponse.ok) {
          const rwaResponseData = await rwaResponse.json();
          const rwaData = rwaResponseData.data;

          // Use the pre-calculated total from the API
          const totalRwaTvl = rwaData?.totalAptosValue || 0;
          setTotals((prev) => ({ ...prev, rwas: formatAmount(totalRwaTvl) }));
        }

        // Fetch DeFi TVL from DeFiLlama
        try {
          const defiResponse = await fetch(
            "https://api.llama.fi/v2/historicalChainTvl/aptos",
          );
          if (defiResponse.ok) {
            const defiData = await defiResponse.json();
            // Get the most recent TVL value
            if (defiData.length > 0) {
              const latestTvl = defiData[defiData.length - 1].tvl;
              setDefiTvl(formatAmount(latestTvl));
            }
          }
        } catch (defiError) {
          logger.error("Failed to fetch DeFi TVL:", defiError);
          // Fallback to internal API if available
        }
      } catch (error) {
        logger.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="dashboard-preview"
      className="min-h-screen flex flex-col py-12 md:py-20"
    >
      <div className="w-full flex-1 flex flex-col justify-center">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Activity className="w-3 h-3 mr-1" />
            Live Stats
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Track Every Asset on{" "}
            <span className="text-primary bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Aptos
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time analytics for all major asset classes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Stablecoins */}
          <Link href="/stables" className="group block">
            <div className="space-y-4 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-200 cursor-pointer">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold font-mono text-foreground">
                {loading ? (
                  <span className="animate-pulse bg-muted rounded w-full h-8 md:h-10 inline-block"></span>
                ) : (
                  totals.stablecoins
                )}
              </p>
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  Stablecoins
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Market Cap
                  </p>
                  <div className="flex items-center -space-x-2">
                    <Image
                      src="/icons/stables/usdc.png"
                      alt="USDC"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/stables/usdt.png"
                      alt="USDT"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/stables/USDA.png"
                      alt="USDA"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/stables/usde.png"
                      alt="USDE"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Bitcoin */}
          <Link href="/btc" className="group block">
            <div className="space-y-4 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-200 cursor-pointer">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold font-mono text-foreground">
                {loading ? (
                  <span className="animate-pulse bg-muted rounded w-full h-8 md:h-10 inline-block"></span>
                ) : (
                  totals.bitcoin
                )}
              </p>
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  Bitcoin
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Value on Aptos
                  </p>
                  <div className="flex items-center -space-x-2">
                    <Image
                      src="/icons/btc/bitcoin.png"
                      alt="BTC"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/btc/WBTC.png"
                      alt="WBTC"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/btc/echo.png"
                      alt="Echo"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/btc/stakestone.png"
                      alt="StakeStone"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* RWA */}
          <Link href="/rwa" className="group block">
            <div className="space-y-4 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-200 cursor-pointer">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold font-mono text-foreground">
                {loading ? (
                  <span className="animate-pulse bg-muted rounded w-full h-8 md:h-10 inline-block"></span>
                ) : (
                  totals.rwas
                )}
              </p>
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  Real World Assets
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Total Value
                  </p>
                  <div className="flex items-center -space-x-2">
                    <Image
                      src="/icons/rwas/blackrock.png"
                      alt="BlackRock"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/rwas/ondo.jpeg"
                      alt="Ondo"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/rwas/libre.png"
                      alt="Libre"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/rwas/securitize.png"
                      alt="Securitize"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* DeFi */}
          <Link href="/defi" className="group block">
            <div className="space-y-4 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-200 cursor-pointer">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold font-mono text-foreground">
                {loading ? (
                  <span className="animate-pulse bg-muted rounded w-full h-8 md:h-10 inline-block"></span>
                ) : (
                  defiTvl || "$0"
                )}
              </p>
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  DeFi
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Total Value Locked
                  </p>
                  <div className="flex items-center -space-x-2">
                    <Image
                      src="/icons/protocols/panora.webp"
                      alt="Panora"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/protocols/thala.avif"
                      alt="Thala"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/protocols/merkle.webp"
                      alt="Merkle"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                    <Image
                      src="/icons/protocols/hyperion.webp"
                      alt="Hyperion"
                      width={20}
                      height={20}
                      className="rounded-full border-2 border-background shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Social Icons and Built By - Aligned to bottom */}
      <div className="flex flex-col items-center gap-4 mt-auto pt-32 pb-8">
        <div className="flex items-center gap-4">
          <a
            href="https://twitter.com/onaptos"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="https://github.com/zacharyr0th"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://onaptos.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Website"
          >
            <Globe className="w-5 h-5" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground/70">
          Built by{" "}
          <a
            href="https://twitter.com/zacharyr0th"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium hover:text-primary transition-colors"
          >
            zacharyr0th
          </a>
        </p>
      </div>
    </div>
  );
};
