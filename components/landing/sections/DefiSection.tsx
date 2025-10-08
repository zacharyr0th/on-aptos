"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { defiProtocols } from "@/components/pages/protocols/defi/data/protocols";
import { ProtocolStats } from "@/components/protocols/ProtocolStats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ProtocolCard from "../shared/ProtocolCard";
import SectionHeader from "../shared/SectionHeader";

export default function DefiSection() {
  const [showAllTrading, setShowAllTrading] = useState(false);
  const [showAllLending, setShowAllLending] = useState(false);
  const [showAllYield, setShowAllYield] = useState(false);
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Trading & DEXs</h3>
                <p className="text-sm text-foreground/70 mt-1">
                  Swap, provide liquidity, and trade seamlessly
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTrading(!showAllTrading)}
                className="gap-2"
              >
                {showAllTrading ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {defiProtocols
                .filter((p) => p.category === "Trading" || p.category === "Multiple")
                .slice(0, showAllTrading ? undefined : 6)
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Lending & Borrowing</h3>
                <p className="text-sm text-foreground/70 mt-1">
                  Supply assets to earn interest or borrow against collateral
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllLending(!showAllLending)}
                className="gap-2"
              >
                {showAllLending ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {defiProtocols
                .filter((p) => p.category === "Credit")
                .slice(0, showAllLending ? undefined : 3)
                .map((protocol, idx) => (
                  <ProtocolCard
                    key={`credit-${protocol.title}-${idx}`}
                    logo={protocol.logo}
                    name={protocol.title}
                    category={protocol.subcategory}
                    href={protocol.href}
                    statsPosition="inline"
                  >
                    <ProtocolStats protocolName={protocol.title} showVolume={false} inline={true} />
                  </ProtocolCard>
                ))}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Yield & Staking</h3>
                <p className="text-sm text-foreground/70 mt-1">
                  Auto-compounding vaults, liquid staking, and optimized strategies
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllYield(!showAllYield)}
                className="gap-2"
              >
                {showAllYield ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {defiProtocols
                .filter((p) => p.category === "Yield")
                .slice(0, showAllYield ? undefined : 3)
                .map((protocol, idx) => (
                  <ProtocolCard
                    key={`yield-${protocol.title}-${idx}`}
                    logo={protocol.logo}
                    name={protocol.title}
                    category={protocol.subcategory}
                    href={protocol.href}
                    statsPosition="inline"
                  >
                    <ProtocolStats protocolName={protocol.title} showVolume={false} inline={true} />
                  </ProtocolCard>
                ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
