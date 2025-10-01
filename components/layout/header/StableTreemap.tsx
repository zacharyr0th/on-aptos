"use client";

import { memo, useMemo } from "react";
import { ResponsiveContainer, Treemap } from "recharts";

interface Token {
  symbol: string;
  fdv?: number;
  marketCap?: number;
  name: string;
}

interface StableTreemapProps {
  tokens: Token[];
}

function StableTreemapComponent({ tokens }: StableTreemapProps) {
  const treemapData = useMemo(() => {
    const validTokens = tokens
      .filter((token) => (token.fdv || token.marketCap || 0) > 1000)
      .sort((a, b) => (b.fdv || b.marketCap || 0) - (a.fdv || a.marketCap || 0))
      .slice(0, 50);

    return validTokens.map((token, index) => ({
      name: token.symbol,
      size: token.fdv || token.marketCap || 0,
      fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    }));
  }, [tokens]);

  if (treemapData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No token data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={treemapData}
        dataKey="size"
        nameKey="name"
        animationDuration={0}
        stroke="#fff"
        strokeWidth={2}
      />
    </ResponsiveContainer>
  );
}

export const StableTreemap = memo(StableTreemapComponent);