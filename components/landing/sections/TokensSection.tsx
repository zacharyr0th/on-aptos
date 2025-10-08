"use client";

import { motion } from "framer-motion";
import { TrendingUp, X } from "lucide-react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TokenData } from "@/lib/types/tokens";
import { formatCurrency, formatNumber } from "@/lib/utils/format/format";
import {
  cardSlideLeft,
  cardSlideRight,
  scaleBlur,
  sectionHeader,
  staggerContainer,
} from "../shared/animations";

const TokenTreemap = dynamic(() =>
  import("@/components/pages/markets/tokens/TokenTreemap").then((m) => m.TokenTreemap)
);

interface TokensSectionProps {
  tokens: TokenData[];
  loadingTokens: boolean;
  error: string | null;
  displayMetrics: {
    marketCap: number;
    tokenCount: number;
    averageMarketCap: number;
    medianMarketCap: number;
  };
  totalTokenCount: number;
  stableTokens: TokenData[];
  fetchInitialData: () => void;
}

export default function TokensSection({
  tokens,
  loadingTokens,
  error,
  displayMetrics,
  totalTokenCount,
  stableTokens,
  fetchInitialData,
}: TokensSectionProps) {
  return (
    <section id="tokens" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div className="text-center mb-12" {...sectionHeader}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                Token Market Overview
              </h2>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Comprehensive view of the Aptos token ecosystem with real-time market data
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12"
            {...staggerContainer}
          >
            <motion.div variants={cardSlideLeft}>
              <Card className="p-4 sm:p-6 bg-card hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-foreground/80">Non-APT Market Cap</h3>
                    <Badge variant="secondary" className="px-3 py-1">
                      Non-APT
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground font-mono">
                    {formatCurrency(displayMetrics.marketCap)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Market capitalization excluding APT
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={cardSlideRight}>
              <Card className="p-4 sm:p-6 bg-card hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-foreground/80">Token Count</h3>
                    <Badge variant="outline" className="px-3 py-1">
                      Active
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground font-mono">
                    {formatNumber(totalTokenCount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total number of tokens in the ecosystem
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Treemap */}
          <motion.div {...scaleBlur}>
            {error ? (
              <div className="flex items-center justify-center py-20">
                <Card className="p-8 max-w-md">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Failed to load data</h3>
                      <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    </div>
                    <button
                      onClick={fetchInitialData}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </Card>
              </div>
            ) : loadingTokens ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-foreground/70">Loading token data...</p>
                </div>
              </div>
            ) : tokens.length > 0 ? (
              <div className="w-full">
                <TokenTreemap tokens={stableTokens} />
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-foreground/70">No token data available</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
