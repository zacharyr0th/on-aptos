"use client";

import { motion } from "framer-motion";
import { TrendingUp, Wallet } from "lucide-react";
import { cardEntranceSubtle } from "../shared/animations";
import CTACard from "../shared/CTACard";

export default function CTASection() {
  return (
    <section id="cta" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={cardEntranceSubtle}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
            Ready to Explore?
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 mb-12 text-center max-w-2xl mx-auto">
            Track your portfolio or discover yield opportunities
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <CTACard
              icon={Wallet}
              title="Track Your Portfolio"
              description="Monitor holdings, track performance, discover opportunities"
              href="/portfolio"
            />
            <CTACard
              icon={TrendingUp}
              title="Explore Yield Opportunities"
              description="Find highest APY pools across DeFi protocols"
              href="/protocols/yields"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
