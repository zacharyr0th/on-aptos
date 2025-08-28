"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Treemap,
} from "recharts";
import {
  formatCurrency,
  formatNumber,
  formatTokenPrice,
} from "@/lib/utils/format";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TokenData {
  panoraId?: string;
  symbol: string;
  name: string;
  price: number;
  supply?: number;
  fdv?: number;
  logoUrl?: string | null;
  panoraTags?: string[];
  panoraUI?: boolean;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  faAddress?: string | null;
  tokenAddress?: string | null;
}

interface TokenTreemapProps {
  tokens: TokenData[];
}

interface TreemapItem {
  name: string;
  size: number;
  symbol: string;
  fdv: number;
  logoUrl?: string | null;
  fill: string;
  percentage: number;
  price: number;
  supply?: number;
  panoraTags?: string[];
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  fullName: string;
}

// Treemap colors constants
const TREEMAP_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#ef4444",
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
];

export function TokenTreemap({ tokens }: TokenTreemapProps) {
  const [selectedToken, setSelectedToken] = useState<TreemapItem | null>(null);

  const treemapData = useMemo(() => {
    console.log(`Treemap received ${tokens.length} tokens from parent`);

    // Use whatever tokens are passed from the parent (respects page filters)
    // Only show tokens with meaningful FDV (supply data available)
    const validTokens = tokens
      .filter((token) => (token.fdv || 0) > 1000) // Minimum $1k FDV
      .sort((a, b) => (b.fdv || 0) - (a.fdv || 0))
      .slice(0, 200); // Show top 200 tokens by FDV

    const stablecoins = validTokens.filter(
      (token) =>
        token.symbol &&
        ["USDC", "USDT", "USDe", "sUSDe", "USDA", "MOD"].includes(token.symbol),
    );
    console.log(
      `Treemap has ${stablecoins.length} stablecoins:`,
      stablecoins.map((t) => t.symbol),
    );

    console.log(`Treemap filtered to ${validTokens.length} valid tokens`);

    if (validTokens.length === 0) return [];

    // Remove duplicates based on address to prevent key conflicts
    const uniqueTokens = validTokens.reduce((acc, token) => {
      const key = token.faAddress || token.tokenAddress || token.symbol;
      if (!acc.has(key)) {
        acc.set(key, token);
      }
      return acc;
    }, new Map());

    const finalTokens = Array.from(uniqueTokens.values());
    console.log(
      `Removed ${validTokens.length - finalTokens.length} duplicate tokens`,
    );

    // Calculate total FDV
    const totalValue = finalTokens.reduce(
      (sum, token) => sum + (token.fdv || 0),
      0,
    );

    return finalTokens.map((token, index) => ({
      name: token.symbol,
      size: token.fdv || 0,
      symbol: token.symbol,
      fdv: token.fdv || 0,
      logoUrl: token.logoUrl,
      fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length],
      percentage: ((token.fdv || 0) / totalValue) * 100,
      price: token.price,
      supply: token.supply,
      panoraTags: token.panoraTags,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
      priceChange24h: token.priceChange24h,
      fullName: token.name,
      uniqueId:
        token.faAddress || token.tokenAddress || `${token.symbol}-${index}`, // Unique ID for keys
    }));
  }, [tokens]);

  if (treemapData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No tokens to display in treemap
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Token Market Cap Treemap</h3>

      {/* Selected Token Details Row */}
      {selectedToken && (
        <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {selectedToken.logoUrl && (
                <Image
                  src={selectedToken.logoUrl}
                  alt={selectedToken.symbol}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-semibold">
                    {selectedToken.fullName}
                  </h4>
                  <Badge variant="outline">{selectedToken.symbol}</Badge>
                  {selectedToken.panoraTags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">
                      {formatTokenPrice(selectedToken.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">FDV</p>
                    <p className="font-medium">
                      {formatCurrency(selectedToken.fdv, "USD", {
                        compact: true,
                      })}
                    </p>
                  </div>
                  {selectedToken.marketCap && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Market Cap
                      </p>
                      <p className="font-medium">
                        {formatCurrency(selectedToken.marketCap, "USD", {
                          compact: true,
                        })}
                      </p>
                    </div>
                  )}
                  {selectedToken.volume24h && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        24h Volume
                      </p>
                      <p className="font-medium">
                        {formatCurrency(selectedToken.volume24h, "USD", {
                          compact: true,
                        })}
                      </p>
                    </div>
                  )}
                  {selectedToken.priceChange24h !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        24h Change
                      </p>
                      <p
                        className={cn(
                          "font-medium",
                          selectedToken.priceChange24h >= 0
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {selectedToken.priceChange24h >= 0 ? "+" : ""}
                        {selectedToken.priceChange24h.toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {selectedToken.supply && (
                    <div>
                      <p className="text-xs text-muted-foreground">Supply</p>
                      <p className="font-medium">
                        {formatNumber(selectedToken.supply, {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Market Share
                    </p>
                    <p className="font-medium">
                      {selectedToken.percentage < 0.001
                        ? `0.000${selectedToken.percentage.toFixed(6).split("0.000")[1]}`
                        : selectedToken.percentage < 0.01
                          ? selectedToken.percentage.toFixed(4)
                          : selectedToken.percentage < 0.1
                            ? selectedToken.percentage.toFixed(3)
                            : selectedToken.percentage < 1
                              ? selectedToken.percentage.toFixed(2)
                              : selectedToken.percentage.toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedToken(null)}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="h-96 w-full bg-neutral-50 dark:bg-neutral-900/50 rounded-lg overflow-hidden border">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <Treemap
            data={treemapData}
            dataKey="size"
            nameKey="name"
            aspectRatio={4 / 3}
            stroke="none"
            content={<TreemapContent onCellClick={setSelectedToken} />}
          >
            <RechartsTooltip content={<TreemapTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Treemap Tooltip Component
const TreemapTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  // Format percentage with more precision for small values
  const formatPercentage = (percent: number) => {
    if (percent < 0.001) return `0.000${percent.toFixed(6).split("0.000")[1]}`;
    if (percent < 0.01) return percent.toFixed(4);
    if (percent < 0.1) return percent.toFixed(3);
    if (percent < 1) return percent.toFixed(2);
    return percent.toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 z-50 min-w-[280px] max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        {data.logoUrl && (
          <Image
            src={data.logoUrl}
            alt={data.symbol}
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <div>
          <p className="font-semibold text-sm">{data.fullName}</p>
          <p className="text-xs text-neutral-500">{data.symbol}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-600 dark:text-neutral-400">Price:</span>
          <span className="font-medium">{formatTokenPrice(data.price)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-neutral-600 dark:text-neutral-400">FDV:</span>
          <span className="font-medium">
            {formatCurrency(data.fdv, "USD", { compact: true })}
          </span>
        </div>
        {data.marketCap && (
          <div className="flex justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">
              Market Cap:
            </span>
            <span className="font-medium">
              {formatCurrency(data.marketCap, "USD", { compact: true })}
            </span>
          </div>
        )}
        {data.volume24h && (
          <div className="flex justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">
              24h Volume:
            </span>
            <span className="font-medium">
              {formatCurrency(data.volume24h, "USD", { compact: true })}
            </span>
          </div>
        )}
        {data.priceChange24h !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">
              24h Change:
            </span>
            <span
              className={cn(
                "font-medium",
                data.priceChange24h >= 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {data.priceChange24h >= 0 ? "+" : ""}
              {data.priceChange24h.toFixed(2)}%
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs border-t pt-1 mt-1">
          <span className="text-neutral-600 dark:text-neutral-400">
            Market Share:
          </span>
          <span className="font-medium">
            {formatPercentage(data.percentage)}%
          </span>
        </div>
        {data.supply && (
          <div className="flex justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">
              Supply:
            </span>
            <span className="font-medium">
              {formatNumber(data.supply, {
                notation: "compact",
                maximumFractionDigits: 1,
              })}
            </span>
          </div>
        )}
      </div>

      {data.panoraTags && data.panoraTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.panoraTags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-500 mt-2">Click to view details</p>
    </div>
  );
};

// Treemap Content Renderer
const TreemapContent = ({ onCellClick, ...props }: any) => {
  const { x, y, width, height, index, name, value, root } = props;
  const fillColor = root?.children?.[index]?.fill || props.fill || "#8884d8";
  const tokenData = root?.children?.[index];

  const handleClick = () => {
    if (onCellClick && tokenData) {
      onCellClick(tokenData);
    }
  };

  // Early return for small rectangles
  if (width < 40 || height < 25) {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        onClick={handleClick}
        style={{
          fill: fillColor,
          stroke: "rgba(255,255,255,0.15)",
          strokeWidth: 1,
          opacity: 0.95,
          cursor: "pointer",
        }}
      />
    );
  }

  const canShowBothLines = width >= 60 && height >= 40;
  const nameFontSize = Math.max(8, Math.min(14, width / 8));
  const displayName =
    name.length > Math.floor(width / 8)
      ? name.substring(0, Math.max(3, Math.floor(width / 8) - 3)) + "..."
      : name;

  return (
    <g
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: "rgba(255,255,255,0.15)",
          strokeWidth: 1,
          opacity: 0.95,
          transition: "opacity 0.2s",
        }}
      />
      <text
        x={x + width / 2}
        y={canShowBothLines ? y + height / 2 - 4 : y + height / 2}
        textAnchor="middle"
        fill="white"
        style={{
          fontSize: `${nameFontSize}px`,
          fontFamily: "system-ui",
          fontWeight: 600,
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))",
          pointerEvents: "none",
        }}
      >
        {displayName}
      </text>
      {canShowBothLines && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          style={{
            fontSize: `${Math.max(6, Math.min(10, width / 12))}px`,
            fontFamily: "system-ui",
            filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))",
            pointerEvents: "none",
          }}
        >
          {formatCurrency(value, "USD", { compact: true })}
        </text>
      )}
    </g>
  );
};
