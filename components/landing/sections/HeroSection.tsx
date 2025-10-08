"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface HeroSectionProps {
  assetValues: {
    stables: { value: number; label: string; description: string };
    rwas: { value: number; label: string; description: string };
    btc: { value: number; label: string; description: string };
    tokens: { value: number; label: string; description: string };
  } | null;
  isLoadingValues: boolean;
}

export default function HeroSection({ assetValues, isLoadingValues }: HeroSectionProps) {
  const [animatedValues, setAnimatedValues] = useState({
    stables: 0,
    rwas: 0,
    btc: 0,
    tokens: 0,
  });

  // Animate values using RAF for better performance
  useEffect(() => {
    if (!assetValues) return;

    const duration = 1500;
    const startTime = Date.now();
    let rafId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutProgress = 1 - (1 - progress) ** 3;

      setAnimatedValues({
        stables: Math.floor(assetValues.stables.value * easeOutProgress),
        rwas: Math.floor(assetValues.rwas.value * easeOutProgress),
        btc: Math.floor(assetValues.btc.value * easeOutProgress),
        tokens: Math.floor(assetValues.tokens.value * easeOutProgress),
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setAnimatedValues({
          stables: assetValues.stables.value,
          rwas: assetValues.rwas.value,
          btc: assetValues.btc.value,
          tokens: assetValues.tokens.value,
        });
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [assetValues]);

  // Format value for display
  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  return (
    <section
      id="overview"
      className="pt-12 pb-16 md:pt-16 md:pb-20 lg:pt-20 lg:pb-24 px-4 sm:px-6 relative overflow-hidden"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background/50 to-background pointer-events-none" />

      {/* Background Aptos Logo - Semi Globe */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[5%] pointer-events-none z-0">
        <div className="relative w-[1200px] sm:w-[1800px] md:w-[2400px] lg:w-[3000px] h-[600px] sm:h-[900px] md:h-[1200px] lg:h-[1500px]">
          {/* Light mode logo */}
          <div className="dark:hidden">
            <Image
              src="/icons/apt.png"
              alt=""
              fill
              className="object-contain"
              priority
              style={{
                opacity: 0.18,
                filter: "blur(2px)",
                maskImage:
                  "radial-gradient(ellipse 80% 60% at center top, black 30%, transparent 65%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 80% 60% at center top, black 30%, transparent 65%)",
              }}
            />
          </div>

          {/* Dark mode logo */}
          <div className="hidden dark:block">
            <Image
              src="/icons/apt.png"
              alt=""
              fill
              className="object-contain"
              priority
              style={{
                opacity: 0.2,
                filter: "blur(2px) invert(1)",
                maskImage:
                  "radial-gradient(ellipse 80% 60% at center top, black 30%, transparent 65%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 80% 60% at center top, black 30%, transparent 65%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Radial glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Bottom fade to white/black */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main heading */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 text-foreground leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            Welcome to the
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Aptos Ecosystem
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            Track your portfolio, explore DeFi, discover tools
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <Link href="/portfolio">
              <button className="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl">
                <span className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" />
                  Portfolio
                </span>
              </button>
            </Link>
            <Link href="#defi">
              <button className="px-8 py-4 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-all duration-200 hover:shadow-md">
                Protocols
              </button>
            </Link>
          </motion.div>

          {/* Asset Value Cards - Integrated into Hero */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  delayChildren: 0.4,
                  staggerChildren: 0.08,
                },
              },
            }}
          >
            {/* Stablecoins Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                },
              }}
            >
              <Link href="/markets/stables">
                <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img
                        src="/icons/stables/usdc.png"
                        alt="USDC"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/stables/usdt.png"
                        alt="USDT"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/stables/usde.png"
                        alt="USDe"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/stables/USDA.png"
                        alt="USDA"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Live
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Stablecoins</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(animatedValues.stables)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      USDC, USDT, USDe, USDA
                    </p>
                  </div>
                </Card>
              </Link>
            </motion.div>

            {/* RWAs Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                },
              }}
            >
              <Link href="/markets/rwas">
                <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img
                        src="/icons/rwas/blackrock.webp"
                        alt="BlackRock"
                        className="w-8 h-8 rounded-full border-2 border-background bg-white"
                      />
                      <img
                        src="/icons/rwas/ft.webp"
                        alt="Franklin Templeton"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/rwas/ondo.webp"
                        alt="Ondo"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/rwas/pact.webp"
                        alt="Pact"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Growing
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Real World Assets</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(animatedValues.rwas)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      BlackRock, Franklin Templeton
                    </p>
                  </div>
                </Card>
              </Link>
            </motion.div>

            {/* BTC Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                },
              }}
            >
              <Link href="/markets/bitcoin">
                <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img
                        src="/icons/btc/echo.webp"
                        alt="aBTC"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/btc/stakestone.webp"
                        alt="SBTC"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/btc/okx.webp"
                        alt="xBTC"
                        className="w-8 h-8 rounded-full border-2 border-background bg-white"
                      />
                      <img
                        src="/icons/btc/WBTC.webp"
                        alt="WBTC"
                        className="w-8 h-8 rounded-full border-2 border-background bg-white"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Bitcoin</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(animatedValues.btc)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">aBTC, SBTC, xBTC</p>
                  </div>
                </Card>
              </Link>
            </motion.div>

            {/* TVL Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                },
              }}
            >
              <Link href="/protocols/defi">
                <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img
                        src="/icons/protocols/echelon.avif"
                        alt="Echelon"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/protocols/panora.webp"
                        alt="Panora"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/protocols/thala.avif"
                        alt="Thala"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <img
                        src="/icons/protocols/merkle.webp"
                        alt="Merkle"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      TVL
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Value Locked</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(animatedValues.tokens)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">Across all protocols</p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
