"use client";

import { Card } from "@/components/ui/card";
import { defiProtocols } from "@/components/pages/protocols/defi/data/protocols";
import { ProtocolStats } from "@/components/protocols/ProtocolStats";
import { motion } from "framer-motion";
import SectionHeader from "../shared/SectionHeader";
import ProtocolCard from "../shared/ProtocolCard";

export default function DefiSection() {
  return (
    <section id="defi" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Explore DeFi Protocols"
            description="Trade, lend, borrow, and earn yield"
          />

          {/* Trading Protocols */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Trading & DEXs</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Swap, provide liquidity, trade with zero MEV
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {defiProtocols
                .filter((p) => p.category === "Trading" || p.category === "Multiple")
                .slice(0, 9)
                .map((protocol, idx) => (
                  <ProtocolCard
                    key={`trading-${protocol.title}-${idx}`}
                    logo={protocol.logo}
                    name={protocol.title}
                    category={protocol.subcategory}
                    href={protocol.href}
                  >
                    <ProtocolStats protocolName={protocol.title} showVolume={true} />
                  </ProtocolCard>
                ))}
            </div>
          </motion.div>

          {/* Credit Protocols */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
              Lending & Borrowing
            </h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Supply assets to earn interest or borrow against collateral
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                {defiProtocols
                  .filter((p) => p.category === "Credit")
                  .map((protocol, idx) => (
                    <ProtocolCard
                      key={`credit-${protocol.title}-${idx}`}
                      logo={protocol.logo}
                      name={protocol.title}
                      category={protocol.subcategory}
                      href={protocol.href}
                      statsPosition="inline"
                    >
                      <ProtocolStats
                        protocolName={protocol.title}
                        showVolume={false}
                        inline={true}
                      />
                    </ProtocolCard>
                  ))}
              </div>

              {/* How DeFi Lending Works */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-6 flex flex-col justify-start h-full">
                <h3 className="font-bold text-lg text-foreground mb-3">How DeFi Lending Works</h3>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                  Supply assets to earn interest or borrow against collateral. Overcollateralized
                  loans governed by smart contracts.
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
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Yield & Staking</h3>
            <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
              Auto-compounding vaults, liquid staking, optimized strategies
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                {defiProtocols
                  .filter((p) => p.category === "Yield")
                  .map((protocol, idx) => (
                    <ProtocolCard
                      key={`yield-${protocol.title}-${idx}`}
                      logo={protocol.logo}
                      name={protocol.title}
                      category={protocol.subcategory}
                      href={protocol.href}
                      statsPosition="inline"
                    >
                      <ProtocolStats
                        protocolName={protocol.title}
                        showVolume={false}
                        inline={true}
                      />
                    </ProtocolCard>
                  ))}
              </div>

              {/* Yield Strategies Explainer */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-6 flex flex-col justify-center h-full">
                <h3 className="font-bold text-lg text-foreground mb-3">Maximize Your Returns</h3>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                  Yield protocols on Aptos offer auto-compounding strategies, liquid staking
                  derivatives, and optimized vault strategies to maximize your returns while
                  maintaining security through audited smart contracts.
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
