"use client";

import { Globe, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { wallets, aptosExchanges, liveBridges, bridgeGuides } from "@/components/landing/data/landing-data";
import { motion } from "framer-motion";

export default function GettingStartedSection() {
  return (
    <section id="getting-started" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: "spring", stiffness: 80, damping: 15 }
            }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Getting Started on Aptos
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Get your wallet set up, acquire APT, and start exploring the ecosystem in minutes
            </p>
          </motion.div>

          {/* Wallets First */}
          <motion.div
            className="mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2
                }
              }
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Choose Your Wallet</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Start by installing a secure wallet to manage your assets and connect to Aptos dApps
            </p>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {wallets.map((wallet, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 30, rotateX: 20, scale: 0.8 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 60,
                        damping: 15
                      }
                    }
                  }}
                >
                <Link href={wallet.href} target="_blank" rel="noopener noreferrer">
                  <Card className="group relative p-4 sm:p-6 md:p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                    {index === 0 && (
                      <Badge variant="default" className="absolute top-3 right-3 text-xs">
                        Recommended
                      </Badge>
                    )}

                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative mt-2">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-background to-muted p-3 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center">
                          <img
                            src={wallet.logo}
                            alt={wallet.name}
                            className={`w-full h-full object-contain rounded-full ${wallet.name === "Aptos Connect" ? "dark:invert" : ""}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                          {wallet.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {wallet.description}
                        </p>
                      </div>
                    </div>

                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </Card>
                </Link>
                </motion.div>
              ))}
            </div>

            {/* Quick Setup Guide - No container, blends with background */}
            <div className="py-12 md:py-16 px-4 sm:px-6">
              <div className="text-center mb-12">
                <h4 className="font-bold text-xl sm:text-2xl md:text-3xl text-foreground mb-3">
                  Get started in minutes
                </h4>
                <p className="text-sm sm:text-base text-foreground/60">Your journey to Aptos DeFi starts here</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
                <div className="flex flex-col items-center text-center space-y-4 group relative min-h-[44px]">
                  <div className="absolute -top-2 -right-2 w-10 h-10 md:w-8 md:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-base md:text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="w-20 h-20 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-3 min-w-[44px] min-h-[44px]">
                    <img src="/icons/petra.webp" alt="Petra" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <h5 className="font-bold text-foreground text-base">Install Petra Wallet</h5>
                  <p className="text-sm text-foreground/60 leading-relaxed">Download the Petra browser extension and create your secure wallet</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-4 group relative">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div className="w-20 h-20 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-3">
                    <Image src="/icons/apt.png" alt="APT" width={80} height={80} className="w-full h-full object-contain rounded-full dark:invert" />
                  </div>
                  <h5 className="font-bold text-foreground text-base">Get APT Tokens</h5>
                  <p className="text-sm text-foreground/60 leading-relaxed">Buy APT on a CEX or through an onboarding partner like MoonPay</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-4 group relative">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div className="w-20 h-20 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-3">
                    <img src="/ans.webp" alt="ANS" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <h5 className="font-bold text-foreground text-base">Claim Your .apt Name</h5>
                  <p className="text-sm text-foreground/60 leading-relaxed">Register your identity on <a href="https://www.aptosnames.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Aptos Names</a></p>
                </div>
                <div className="flex flex-col items-center text-center space-y-4 group relative">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <div className="w-20 h-20 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-3">
                    <TrendingUp className="w-12 h-12 text-primary" />
                  </div>
                  <h5 className="font-bold text-foreground text-base">Explore DeFi</h5>
                  <p className="text-sm text-foreground/60 leading-relaxed">Start trading, lending, and earning yield on Aptos protocols</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Exchanges */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, x: 100, rotateY: 20 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              rotateY: { type: "spring", stiffness: 70, damping: 20 }
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Buy APT on Exchanges</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Trade Aptos tokens globally on leading exchanges like Coinbase, Binance, and Upbit with instant access to liquidity in USD, USDC, and USDT
            </p>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {aptosExchanges.map((exchange, index) => {
                  const content = (
                    <Card className="group relative p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      <div className="flex flex-col items-center text-center space-y-4">
                        {/* Regional Badge */}
                        <Badge
                          variant={exchange.region === "US" ? "default" : exchange.region === "KR" ? "secondary" : "outline"}
                          className="absolute top-3 right-3 text-xs"
                        >
                          {exchange.region === "US" ? "🇺🇸 US" : exchange.region === "KR" ? "🇰🇷 Korea" : "🌍 Global"}
                        </Badge>

                        {/* Exchange Logo with enhanced styling */}
                        <div className="relative mt-2">
                          {exchange.logo ? (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-muted p-2.5 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center">
                              <img src={exchange.logo} alt={exchange.name} className="w-full h-full object-contain rounded-full" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
                              <Globe className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {exchange.name}
                          </h3>
                        </div>

                        {/* Supported Assets Section */}
                        <div className="w-full pt-3">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Supported Assets</p>
                          <div className="flex gap-2 justify-center items-center">
                            <div className="relative group/icon">
                              <img src="/icons/apt.png" alt="APT" className="w-7 h-7 rounded-full dark:invert transition-transform group-hover/icon:scale-110" />
                            </div>
                            {exchange.usdt === "Y" && (
                              <div className="relative group/icon">
                                <img src="/icons/stables/usdt.png" alt="USDT" className="w-7 h-7 rounded-full transition-transform group-hover/icon:scale-110" />
                              </div>
                            )}
                            {exchange.usdc === "Y" && (
                              <div className="relative group/icon">
                                <img src="/icons/stables/usdc.png" alt="USDC" className="w-7 h-7 rounded-full transition-transform group-hover/icon:scale-110" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  );

                  return exchange.link ? (
                    <Link
                      key={index}
                      href={exchange.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={index}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Bridges */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Bridge Assets to Aptos</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Transfer assets from Ethereum, Solana, and other chains using secure, audited bridges powered by LayerZero, Circle CCTP, and Wormhole
            </p>

            {/* Bridge Comparison Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              {liveBridges.map((bridge, index) => (
                <Link key={index} href={bridge.href} target="_blank" rel="noopener noreferrer">
                  <Card className="group relative p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                    {/* Status Badge */}
                    <Badge variant="default" className="absolute top-3 right-3 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      {bridge.status}
                    </Badge>

                    <div className="flex flex-col space-y-4">
                      {/* Logo and Name */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md flex items-center justify-center flex-shrink-0">
                          <img src={bridge.logo} alt={bridge.name} className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                            {bridge.name}
                          </h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {bridge.protocol}
                          </Badge>
                        </div>
                      </div>

                      {/* Bridge Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Time</p>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">{bridge.bridgeTime}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Fees</p>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">{bridge.fees}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Networks</p>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">{bridge.networks}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
                        {bridge.description}
                      </p>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </Card>
                </Link>
              ))}

              {/* Bridging Guide Card */}
              {bridgeGuides.map((bridge, index) => (
                <Link key={`guide-${index}`} href={bridge.href} target="_blank" rel="noopener noreferrer">
                  <Card className="group relative p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-primary/5 to-card border-2 border-primary/20 hover:border-primary/40">
                    <Badge variant="default" className="absolute top-3 right-3 text-xs">
                      Guide
                    </Badge>

                    <div className="flex flex-col items-center text-center space-y-4 justify-center h-full">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 p-3 flex items-center justify-center">
                        <img src={bridge.logo} alt={bridge.name} className="w-full h-full object-contain dark:invert rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {bridge.name}
                        </h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          {bridge.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
