"use client";

import { Shield, DollarSign, Zap } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { defiProtocols } from "@/components/pages/protocols/defi/data/protocols";
import { ProtocolStats } from "@/components/protocols/ProtocolStats";
import { motion } from "framer-motion";

export default function DefiSection() {
  return (
    <section id="defi" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, scale: 0.85, rotateZ: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotateZ: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: "spring", stiffness: 70, damping: 18 }
            }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Explore DeFi Protocols
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Trade, lend, borrow, and earn yield with lightning-fast transactions and minimal fees — browse protocols by category below
            </p>
          </motion.div>

          {/* Why Trade on Aptos - No container, blends with background */}
          <motion.div
            className="mb-16 py-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                  delayChildren: 0.1
                }
              }
            }}
          >
            <h3 className="font-bold text-xl sm:text-2xl md:text-3xl text-foreground mb-12 text-center">
              Why Trade on Aptos?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              <motion.div
                className="flex flex-col items-center text-center gap-4 p-6 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all duration-300 group"
                variants={{
                  hidden: { opacity: 0, x: -50, rotateY: -20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                    transition: {
                      type: "spring",
                      stiffness: 60,
                      damping: 18
                    }
                  }
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-2">No MEV / Sandwich Attacks</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">Fair transaction ordering prevents frontrunning and MEV extraction</p>
                </div>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center gap-4 p-6 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all duration-300 group"
                variants={{
                  hidden: { opacity: 0, y: 50, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 60,
                      damping: 18
                    }
                  }
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-2">Low, Fixed Network Fees</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">Predictable costs with fees priced in USD, paid in APT</p>
                </div>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center gap-4 p-6 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all duration-300 group"
                variants={{
                  hidden: { opacity: 0, x: 50, rotateY: 20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                    transition: {
                      type: "spring",
                      stiffness: 60,
                      damping: 18
                    }
                  }
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-2">Insanely Fast Swaps</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">Sub-second finality means instant swap confirmation</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Trading Protocols */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 60, rotateX: 15, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: "spring", stiffness: 60, damping: 18 }
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Trading & DEXs</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Swap tokens, provide liquidity, and trade on decentralized exchanges with zero MEV risk
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {defiProtocols.filter(p => p.category === "Trading" || p.category === "Multiple").slice(0, 9).map((protocol, idx) => {
                const content = (
                  <Card className="group relative p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0">
                            <img
                              src={protocol.logo}
                              alt={protocol.title}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                            {protocol.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {protocol.subcategory}
                          </p>
                        </div>
                      </div>
                      <ProtocolStats protocolName={protocol.title} showVolume={true} />
                    </div>
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </Card>
                );

                return protocol.href ? (
                  <Link
                    key={`trading-${protocol.title}-${idx}`}
                    href={protocol.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={`trading-${protocol.title}-${idx}`}>
                    {content}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Credit Protocols */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, x: -80, rotateZ: -3 }}
            whileInView={{ opacity: 1, x: 0, rotateZ: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Lending & Borrowing</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Supply assets to earn interest or borrow against your collateral — all secured by audited smart contracts
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                {defiProtocols.filter(p => p.category === "Credit").map((protocol, idx) => {
                  const content = (
                    <Card className="group relative p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0">
                            <img
                              src={protocol.logo}
                              alt={protocol.title}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                            {protocol.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {protocol.subcategory}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <ProtocolStats protocolName={protocol.title} showVolume={false} inline={true} />
                        </div>
                      </div>
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  );

                  return protocol.href ? (
                    <Link
                      key={`credit-${protocol.title}-${idx}`}
                      href={protocol.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={`credit-${protocol.title}-${idx}`}>
                      {content}
                    </div>
                  );
                })}
              </div>

              {/* How DeFi Lending Works */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-6 flex flex-col justify-start h-full">
                <h3 className="font-bold text-lg text-foreground mb-3">How DeFi Lending Works</h3>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                  Supply assets to earn interest from borrowers, or use your crypto as collateral to borrow other assets. All lending is overcollateralized and governed by smart contracts.
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground/70">Overcollateralized loans</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground/70">Transparent smart contracts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground/70">Earn interest on deposits</span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Yield Protocols */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, x: 80, rotateZ: 3, scale: 0.9 }}
            whileInView={{ opacity: 1, x: 0, rotateZ: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: "spring", stiffness: 60, damping: 18 }
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Yield & Staking</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Maximize returns with auto-compounding vaults, liquid staking, and optimized yield strategies
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                {defiProtocols.filter(p => p.category === "Yield").map((protocol, idx) => {
                  const content = (
                    <Card className="group relative p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0">
                            <img
                              src={protocol.logo}
                              alt={protocol.title}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                            {protocol.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {protocol.subcategory}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <ProtocolStats protocolName={protocol.title} showVolume={false} inline={true} />
                        </div>
                      </div>
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  );

                  return protocol.href ? (
                    <Link
                      key={`yield-${protocol.title}-${idx}`}
                      href={protocol.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={`yield-${protocol.title}-${idx}`}>
                      {content}
                    </div>
                  );
                })}
              </div>

              {/* Yield Strategies Explainer */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-6 flex flex-col justify-center h-full">
                <h3 className="font-bold text-lg text-foreground mb-3">Maximize Your Returns</h3>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                  Yield protocols on Aptos offer auto-compounding strategies, liquid staking derivatives, and optimized vault strategies to maximize your returns while maintaining security through audited smart contracts.
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground/70">Auto-compounding rewards</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground/70">Liquid staking tokens</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground/70">Optimized yield strategies</span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
