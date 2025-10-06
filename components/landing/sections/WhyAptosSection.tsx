"use client";

import { Zap, Shield, Code, TrendingUp, Layers, Users, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import USDTCostChart from "@/components/pages/performance/USDTCostChart";
import { motion } from "framer-motion";

// Pre-sorted static data for performance
const USDT_COST_DATA = [
  { chain: "Aptos", cost: "$0.0001", logo: "/icons/apt.png", isLowest: true },
  { chain: "Polygon", cost: "$0.0003", logo: "/icons/performance/polygon.png", isLowest: false },
  { chain: "Avalanche", cost: "$0.0003", logo: "/icons/performance/avax.png", isLowest: false },
  { chain: "Solana", cost: "$0.002-0.12", logo: "/icons/performance/sol.png", isLowest: false },
  { chain: "BNB Chain", cost: "$0.0026", logo: "/icons/performance/bnb.png", isLowest: false },
  { chain: "Polkadot", cost: "$0.0061", logo: "/icons/performance/polkadot.png", isLowest: false },
  { chain: "Ethereum", cost: "$0.0277", logo: "/icons/performance/eth.png", isLowest: false },
  { chain: "TON", cost: "$0.0444", logo: "/icons/performance/ton.png", isLowest: false },
  { chain: "TRON", cost: "$2-4", logo: "/icons/performance/trx.png", isLowest: false },
];

export default function WhyAptosSection() {
  return (
    <section id="why-aptos" className="py-16 md:py-20 lg:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.15) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground tracking-tight">
              Why Aptos?
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed font-light">
              Built for the next generation of blockchain applications — combining <span className="font-semibold text-foreground">blazing speed</span>, <span className="font-semibold text-foreground">bulletproof security</span>, and <span className="font-semibold text-foreground">infinite scalability</span>
            </p>
          </motion.div>

          {/* Feature Cards - Improved Grid Layout */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.15
                }
              }
            }}
          >
            {/* Lightning Fast */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -20, rotateY: -10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  rotateY: 0,
                  transition: {
                    type: "spring",
                    stiffness: 80,
                    damping: 16
                  }
                }
              }}
            >
            <Card className="group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">Lightning Fast</h3>
                  <p className="text-foreground/70 leading-relaxed">
                    Process <span className="font-mono font-semibold text-foreground">20k+</span> transactions per second with sub-second finality — <span className="font-mono font-semibold text-foreground">6,000x</span> faster than Ethereum
                  </p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Secure by Design */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -20, rotateY: -10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  rotateY: 0,
                  transition: {
                    type: "spring",
                    stiffness: 80,
                    damping: 16
                  }
                }
              }}
            >
            <Card className="group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">Secure by Design</h3>
                  <p className="text-foreground/70 leading-relaxed">
                    Move language prevents common vulnerabilities that plague Solidity chains — built with safety as a first principle
                  </p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Massively Scalable */}
            <motion.div variants={{ hidden: { opacity: 0, x: -20, rotateY: -10 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: "spring", stiffness: 100, damping: 12 } } }}>
            <Card className="group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">Massively Scalable</h3>
                  <p className="text-foreground/70 leading-relaxed">
                    Parallel execution engine processes thousands of transactions simultaneously without compromising performance
                  </p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Developer Friendly */}
            <motion.div variants={{ hidden: { opacity: 0, x: -20, rotateY: -10 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: "spring", stiffness: 100, damping: 12 } } }}>
            <Card className="group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Code className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">Developer Friendly</h3>
                  <p className="text-foreground/70 leading-relaxed">
                    Ship in days with Move, comprehensive SDKs, and extensive documentation — everything you need to build fast
                  </p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Modular & Composable */}
            <motion.div variants={{ hidden: { opacity: 0, x: -20, rotateY: -10 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: "spring", stiffness: 100, damping: 12 } } }}>
            <Card className="group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Layers className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">Modular & Composable</h3>
                  <p className="text-foreground/70 leading-relaxed">
                    Flexible infrastructure lets you build exactly what you need — from DeFi to gaming to enterprise solutions
                  </p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Thriving Community */}
            <motion.div variants={{ hidden: { opacity: 0, x: -20, rotateY: -10 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: "spring", stiffness: 100, damping: 12 } } }}>
            <Card className="group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">Thriving Community</h3>
                  <p className="text-foreground/70 leading-relaxed">
                    Join thousands of builders, investors, and innovators shaping the future of decentralized applications
                  </p>
                </div>
              </div>
            </Card>
            </motion.div>
          </motion.div>

          {/* Network Performance - Minimal Professional Design */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <div className="border-t border-border/50 pt-12">
              <div className="text-center mb-12">
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-2">Network Performance</h3>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-6 md:gap-y-10 max-w-5xl mx-auto">
                <div className="text-center space-y-2">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-mono tracking-tight">
                    22k
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Max TPS</div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-mono tracking-tight">
                    &lt;1s
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Finality</div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-mono tracking-tight">
                    0.11s
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Block Time</div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-mono tracking-tight">
                    19
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Nakamoto Coefficient</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* USDT Transfer Costs Section */}
          <motion.div
            className="mt-24"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Lowest USDt Transfer Costs
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                Aptos offers the most cost-effective USDT transfers — up to 40,000x cheaper than other chains
              </p>
            </div>

            {/* USDT Cost Comparison Chart */}
            <div className="w-full h-[300px] sm:text-[400px] md:h-[500px] lg:h-[600px]">
              <Suspense fallback={<div className="h-full flex items-center justify-center">Loading chart...</div>}>
                <USDTCostChart data={USDT_COST_DATA} />
              </Suspense>
            </div>
            <div className="text-center mt-6">
              <Link href="/performance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                View detailed performance comparison
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Chain Performance Comparison Grid */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Chain Performance Comparison
              </h3>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div className="space-y-4 min-w-[900px] md:min-w-0">
                  {/* Aptos Row */}
                  <div className="flex gap-3 md:gap-4 items-center">
                    <div className="flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center">
                    <Image src="/icons/apt.png" alt="Aptos" width={32} height={32} className="dark:invert mb-1" />
                    <div className="text-xs font-semibold text-center font-mono">Aptos</div>
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-2 md:gap-3">
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">12.9k</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Max TPS (100 blocks)</div>
                    </div>
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">22k</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Max TPS (1 block)</div>
                    </div>
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">&lt;1s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Finality</div>
                    </div>
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">0.11s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Block Time</div>
                    </div>
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">19</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Nakamoto</div>
                    </div>
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">151</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Validators</div>
                    </div>
                  </div>
                </div>

                {/* Sui Row */}
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center">
                    <Image src="/icons/performance/sui.png" alt="Sui" width={32} height={32} className="mb-1" />
                    <div className="text-xs font-semibold text-center font-mono">Sui</div>
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-2 md:gap-3">
                    <div className="border border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-orange-800 dark:text-orange-600 mb-1 font-mono">926</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Max TPS (100 blocks)</div>
                      <div className="text-[9px] md:text-xs text-orange-700 dark:text-orange-500 font-mono">is 14x better</div>
                    </div>
                    <div className="border border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-orange-800 dark:text-orange-600 mb-1 font-mono">11.5k</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Max TPS (1 block)</div>
                      <div className="text-[9px] md:text-xs text-orange-700 dark:text-orange-500 font-mono">is 1.9x better</div>
                    </div>
                    <div className="border border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/5 rounded-lg p-2 md:p-3 text-center relative">
                      <Check className="absolute top-1 right-1 md:top-2 md:right-2 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-500 mb-1 font-mono">&lt;1s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Finality</div>
                      <div className="text-[9px] md:text-xs text-emerald-700 dark:text-emerald-500">Same as Aptos</div>
                    </div>
                    <div className="border border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-orange-800 dark:text-orange-600 mb-1 font-mono">0.25s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Block Time</div>
                      <div className="text-[9px] md:text-xs text-orange-700 dark:text-orange-500 font-mono">is 2.3x better</div>
                    </div>
                    <div className="border border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-orange-800 dark:text-orange-600 mb-1 font-mono">18</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Nakamoto</div>
                      <div className="text-[9px] md:text-xs text-orange-700 dark:text-orange-500 font-mono">is 1.1x better</div>
                    </div>
                    <div className="border border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-orange-800 dark:text-orange-600 mb-1 font-mono">121</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Validators</div>
                      <div className="text-[9px] md:text-xs text-orange-700 dark:text-orange-500 font-mono">is 1.2x better</div>
                    </div>
                  </div>
                </div>

                {/* TRON Row */}
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center">
                    <Image src="/icons/performance/trx.png" alt="TRON" width={32} height={32} className="mb-1" />
                    <div className="text-xs font-semibold text-center font-mono">TRON</div>
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-2 md:gap-3">
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">272</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Max TPS (100 blocks)</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 48x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">734</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Max TPS (1 block)</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 30x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">57s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Finality</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 57x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">3s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Block Time</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 27x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">5</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Nakamoto</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 3.8x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">27</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Validators</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 5.6x better</div>
                    </div>
                  </div>
                </div>

                {/* Base Row */}
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center">
                    <Image src="/icons/performance/base.png" alt="Base" width={32} height={32} className="mb-1" />
                    <div className="text-xs font-semibold text-center font-mono">Base</div>
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-2 md:gap-3">
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">1.3k</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Max TPS (100 blocks)</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 10x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">1.9k</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Max TPS (1 block)</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 11x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">13m13s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Finality</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 793x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">2s</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Block Time</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 18x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">1</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Nakamoto</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 19x better</div>
                    </div>
                    <div className="border border-red-400 bg-red-100 dark:border-red-800/40 dark:bg-red-950/5 rounded-lg p-2 md:p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-800 dark:text-red-600 mb-1 font-mono">1</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground leading-tight mb-1">Validators</div>
                      <div className="text-[9px] md:text-xs text-red-700 dark:text-red-500 font-mono">is 151x better</div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              <div className="text-center mt-8">
                <Link href="/performance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  Click here to compare with more chains →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
