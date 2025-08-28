import { NextRequest, NextResponse } from "next/server";

import {
  MetricsDatabase,
  CreateMetricSnapshotInput,
} from "@/lib/database/client";
import { apiLogger } from "@/lib/utils/core/logger";

// POST: Generate simplified snapshot from current metrics data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      date = new Date().toISOString().split("T")[0], // Default to today
      initializeSchema = false,
    } = body;

    // Initialize schema if requested or if it's the first run
    if (initializeSchema) {
      await MetricsDatabase.initializeSchema();
      apiLogger.info("Simplified database schema initialized");
    }

    // Get base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3001`;

    // Fetch current metrics from key APIs
    const snapshots: CreateMetricSnapshotInput[] = [];

    // === MARKET PRICES ===
    try {
      // APT Price
      const aptResponse = await fetch(`${baseUrl}/api/prices/cmc/apt`);
      if (aptResponse.ok) {
        const aptPrice = await aptResponse.json();
        if (aptPrice?.price?.price) {
          snapshots.push({
            category: "Market Prices",
            metric: "APT Price",
            source: "CoinMarketCap",
            snapshot_date: date,
            value_numeric: aptPrice.price.price,
            formatted_value: `$${aptPrice.price.price.toFixed(4)}`,
            metadata: {
              market_cap: aptPrice.price.marketCap,
              change_24h: aptPrice.price.change24h,
              volume_24h: aptPrice.price.volume24h,
            },
          });

          // Market Cap
          if (aptPrice.price.marketCap) {
            snapshots.push({
              category: "Market Metrics",
              metric: "APT Market Cap",
              source: "CoinMarketCap",
              snapshot_date: date,
              value_numeric: aptPrice.price.marketCap,
              formatted_value: formatCurrency(aptPrice.price.marketCap),
              metadata: { price: aptPrice.price.price },
            });
          }

          // 24h Volume
          if (aptPrice.price.volume24h) {
            snapshots.push({
              category: "Trading Volume",
              metric: "APT Volume (24h)",
              source: "CoinMarketCap",
              snapshot_date: date,
              value_numeric: aptPrice.price.volume24h,
              formatted_value: formatCurrency(aptPrice.price.volume24h),
              metadata: { change_24h: aptPrice.price.change24h },
            });
          }

          // Price Change
          snapshots.push({
            category: "Market Performance",
            metric: "APT Price Change (24h)",
            source: "CoinMarketCap",
            snapshot_date: date,
            value_numeric: aptPrice.price.change24h,
            formatted_value: `${aptPrice.price.change24h > 0 ? "+" : ""}${aptPrice.price.change24h.toFixed(2)}%`,
            metadata: { current_price: aptPrice.price.price },
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch APT price", error);
    }

    try {
      // BTC Price
      const btcResponse = await fetch(`${baseUrl}/api/prices/cmc/btc`);
      if (btcResponse.ok) {
        const btcPrice = await btcResponse.json();
        if (btcPrice?.price?.price) {
          snapshots.push({
            category: "Market Prices",
            metric: "BTC Price",
            source: "CoinMarketCap",
            snapshot_date: date,
            value_numeric: btcPrice.price.price,
            formatted_value: `$${btcPrice.price.price.toLocaleString()}`,
            metadata: {
              change_24h: btcPrice.price.change24h,
              volume_24h: btcPrice.price.volume24h,
            },
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch BTC price", error);
    }

    // === TOKEN ECOSYSTEM ===
    try {
      // Token data from Panora
      const tokensResponse = await fetch(
        `${baseUrl}/api/aptos/tokens?limit=5000`,
      );
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        if (tokensData?.tokens?.length) {
          const verifiedTokens = tokensData.tokens.filter((t: any) =>
            t.panoraTags?.includes("Verified"),
          ).length;
          const nativeTokens = tokensData.tokens.filter((t: any) =>
            t.panoraTags?.includes("Native"),
          ).length;
          const memeTokens = tokensData.tokens.filter((t: any) =>
            t.panoraTags?.includes("Meme"),
          ).length;
          const bridgedTokens = tokensData.tokens.filter((t: any) =>
            t.panoraTags?.includes("Bridged"),
          ).length;

          snapshots.push({
            category: "Token Ecosystem",
            metric: "Total Tokens",
            source: "Panora API",
            snapshot_date: date,
            value_numeric: tokensData.tokens.length,
            formatted_value: tokensData.tokens.length.toLocaleString(),
            metadata: {
              verified_count: verifiedTokens,
              native_count: nativeTokens,
              meme_count: memeTokens,
              bridged_count: bridgedTokens,
            },
          });

          snapshots.push({
            category: "Token Ecosystem",
            metric: "Verified Tokens",
            source: "Panora API",
            snapshot_date: date,
            value_numeric: verifiedTokens,
            formatted_value: verifiedTokens.toLocaleString(),
            metadata: { total_tokens: tokensData.tokens.length },
          });

          snapshots.push({
            category: "Token Ecosystem",
            metric: "Native Tokens",
            source: "Panora API",
            snapshot_date: date,
            value_numeric: nativeTokens,
            formatted_value: nativeTokens.toLocaleString(),
            metadata: { total_tokens: tokensData.tokens.length },
          });

          snapshots.push({
            category: "Token Ecosystem",
            metric: "Meme Tokens",
            source: "Panora API",
            snapshot_date: date,
            value_numeric: memeTokens,
            formatted_value: memeTokens.toLocaleString(),
            metadata: { total_tokens: tokensData.tokens.length },
          });

          snapshots.push({
            category: "Token Ecosystem",
            metric: "Bridged Tokens",
            source: "Panora API",
            snapshot_date: date,
            value_numeric: bridgedTokens,
            formatted_value: bridgedTokens.toLocaleString(),
            metadata: { total_tokens: tokensData.tokens.length },
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch token data", error);
    }

    // === DEFI METRICS ===
    try {
      // TVL from DeFiLlama
      const tvlResponse = await fetch(`${baseUrl}/api/analytics/tvl/aptos`);
      if (tvlResponse.ok) {
        const tvlData = await tvlResponse.json();
        if (tvlData?.currentTvl) {
          snapshots.push({
            category: "DeFi Metrics",
            metric: "Aptos TVL",
            source: "DeFiLlama",
            snapshot_date: date,
            value_numeric: tvlData.currentTvl,
            formatted_value: formatCurrency(tvlData.currentTvl),
            metadata: {
              chain_rank: tvlData.chainComparison?.aptosRank,
            },
          });

          // TVL Rank
          if (tvlData.chainComparison?.aptosRank) {
            snapshots.push({
              category: "DeFi Rankings",
              metric: "TVL Chain Rank",
              source: "DeFiLlama",
              snapshot_date: date,
              value_numeric: tvlData.chainComparison.aptosRank,
              formatted_value: `#${tvlData.chainComparison.aptosRank}`,
              metadata: { tvl: tvlData.currentTvl },
            });
          }
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch TVL data", error);
    }

    try {
      // Global DEX Volume
      const volumeResponse = await fetch(`${baseUrl}/api/analytics/volume`);
      if (volumeResponse.ok) {
        const volumeData = await volumeResponse.json();
        if (volumeData?.aptosVolume?.volume24h) {
          snapshots.push({
            category: "Trading Volume",
            metric: "Aptos DEX Volume (24h)",
            source: "DeFiLlama",
            snapshot_date: date,
            value_numeric: volumeData.aptosVolume.volume24h,
            formatted_value: formatCurrency(volumeData.aptosVolume.volume24h),
            metadata: {
              volume_7d: volumeData.aptosVolume.volume7d,
              global_volume: volumeData.globalVolume?.volume24h,
            },
          });
        }

        if (volumeData?.aptosVolume?.volume7d) {
          snapshots.push({
            category: "Trading Volume",
            metric: "Aptos DEX Volume (7d)",
            source: "DeFiLlama",
            snapshot_date: date,
            value_numeric: volumeData.aptosVolume.volume7d,
            formatted_value: formatCurrency(volumeData.aptosVolume.volume7d),
            metadata: { volume_24h: volumeData.aptosVolume.volume24h },
          });
        }

        if (volumeData?.globalVolume?.volume24h) {
          snapshots.push({
            category: "Trading Volume",
            metric: "Global DEX Volume (24h)",
            source: "DeFiLlama",
            snapshot_date: date,
            value_numeric: volumeData.globalVolume.volume24h,
            formatted_value: formatCurrency(volumeData.globalVolume.volume24h),
            metadata: { aptos_volume: volumeData.aptosVolume?.volume24h },
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch volume data", error);
    }

    // === STABLECOINS ===
    try {
      // Stablecoin data
      const stablesResponse = await fetch(`${baseUrl}/api/aptos/stables`);
      if (stablesResponse.ok) {
        const stablesData = await stablesResponse.json();
        if (stablesData?.stablecoins?.length) {
          const totalSupply = stablesData.stablecoins.reduce(
            (sum: number, stable: any) => {
              return sum + (parseFloat(stable.supply || "0") || 0);
            },
            0,
          );

          snapshots.push({
            category: "Stablecoins",
            metric: "Total Stablecoins",
            source: "On-chain Data",
            snapshot_date: date,
            value_numeric: stablesData.stablecoins.length,
            formatted_value: stablesData.stablecoins.length.toString(),
            metadata: { total_supply: totalSupply },
          });

          snapshots.push({
            category: "Stablecoins",
            metric: "Total Stablecoin Supply",
            source: "On-chain Data",
            snapshot_date: date,
            value_numeric: totalSupply,
            formatted_value: formatCurrency(totalSupply),
            metadata: { stablecoin_count: stablesData.stablecoins.length },
          });

          // Individual stablecoin supplies
          const majorStables = stablesData.stablecoins.slice(0, 5); // Top 5
          majorStables.forEach((stable: any) => {
            if (stable.supply && parseFloat(stable.supply) > 1000) {
              snapshots.push({
                category: "Stablecoins",
                metric: `${stable.symbol} Supply`,
                source: "On-chain Data",
                snapshot_date: date,
                value_numeric: parseFloat(stable.supply),
                formatted_value: formatCurrency(parseFloat(stable.supply)),
                metadata: {
                  name: stable.name,
                  symbol: stable.symbol,
                  decimals: stable.decimals,
                },
              });
            }
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch stablecoin data", error);
    }

    // === BITCOIN ECOSYSTEM ===
    try {
      const btcAssetsResponse = await fetch(`${baseUrl}/api/aptos/btc`);
      if (btcAssetsResponse.ok) {
        const btcData = await btcAssetsResponse.json();
        if (btcData?.assets?.length) {
          const totalBtcValue = btcData.assets.reduce(
            (sum: number, asset: any) => {
              return sum + (asset.totalValueUSD || 0);
            },
            0,
          );

          snapshots.push({
            category: "Bitcoin Ecosystem",
            metric: "BTC Assets Count",
            source: "On-chain Data",
            snapshot_date: date,
            value_numeric: btcData.assets.length,
            formatted_value: btcData.assets.length.toString(),
            metadata: { total_value_usd: totalBtcValue },
          });

          snapshots.push({
            category: "Bitcoin Ecosystem",
            metric: "Total BTC Value",
            source: "On-chain Data",
            snapshot_date: date,
            value_numeric: totalBtcValue,
            formatted_value: formatCurrency(totalBtcValue),
            metadata: { asset_count: btcData.assets.length },
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch BTC assets data", error);
    }

    // === RWA ECOSYSTEM ===
    try {
      const rwaResponse = await fetch(`${baseUrl}/api/aptos/rwa`);
      if (rwaResponse.ok) {
        const rwaData = await rwaResponse.json();
        if (rwaData?.assets?.length) {
          const totalRwaValue = rwaData.assets.reduce(
            (sum: number, asset: any) => {
              return sum + (asset.totalValueUSD || 0);
            },
            0,
          );

          snapshots.push({
            category: "RWA Ecosystem",
            metric: "RWA Assets Count",
            source: "On-chain Data",
            snapshot_date: date,
            value_numeric: rwaData.assets.length,
            formatted_value: rwaData.assets.length.toString(),
            metadata: { total_value_usd: totalRwaValue },
          });

          snapshots.push({
            category: "RWA Ecosystem",
            metric: "Total RWA Value",
            source: "On-chain Data",
            snapshot_date: date,
            value_numeric: totalRwaValue,
            formatted_value: formatCurrency(totalRwaValue),
            metadata: { asset_count: rwaData.assets.length },
          });
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch RWA data", error);
    }

    // Add fallback system status if no metrics were collected
    if (snapshots.length === 0) {
      snapshots.push({
        category: "System Status",
        metric: "Snapshot Generated",
        source: "System",
        snapshot_date: date,
        value_text: "success",
        formatted_value: "Success",
      });
    }

    // Store all snapshots
    let successCount = 0;
    const errors: string[] = [];

    for (const snapshot of snapshots) {
      try {
        await MetricsDatabase.upsertSnapshot(snapshot);
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(
          `${snapshot.category} - ${snapshot.metric}: ${errorMessage}`,
        );
        apiLogger.error("Error storing snapshot:", error);
      }
    }

    apiLogger.info(
      `Generated and stored ${successCount}/${snapshots.length} snapshots for ${date}`,
    );

    return NextResponse.json({
      success: successCount > 0,
      message: `Generated snapshot for ${date}`,
      date,
      totalMetrics: snapshots.length,
      storedMetrics: successCount,
      snapshot_1_complete: successCount > 0,
      errors: errors.length > 0 ? errors : undefined,
      snapshots: snapshots.map((s) => ({
        category: s.category,
        metric: s.metric,
        value: s.formatted_value,
        source: s.source,
      })),
    });
  } catch (error) {
    apiLogger.error("Error generating snapshots:", error);

    return NextResponse.json(
      {
        error: "Failed to generate snapshots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper function to format currency
function formatCurrency(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}
