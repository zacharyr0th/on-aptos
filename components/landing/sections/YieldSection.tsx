"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { YieldTable } from "@/components/pages/tools/portfolio/YieldTable";
import { motion } from "framer-motion";
import { slideInLeft, rotateScale } from "../shared/animations";

export default function YieldSection() {
  return (
    <section
      id="yield"
      className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden bg-muted/30"
    >
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div className="flex items-center justify-between mb-8" {...slideInLeft}>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                Top Yield Opportunities
              </h2>
              <p className="text-sm sm:text-base text-foreground/70">
                Discover the highest APY pools across Aptos DeFi protocols
              </p>
            </div>
            <Link href="/protocols/yields">
              <Button
                variant="ghost"
                className="gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Yields Component */}
          <motion.div {...rotateScale}>
            <Suspense
              fallback={
                <Card className="p-6">
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                </Card>
              }
            >
              <YieldTable limit={10} compact={true} />
            </Suspense>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
