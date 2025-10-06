"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CTASection() {
  return (
    <section id="cta" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, scale: 0.85, y: 50, rotateX: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            scale: { type: "spring", stiffness: 60, damping: 20 }
          }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
            Get Started on Aptos
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 mb-12 text-center max-w-2xl mx-auto">
            Whether you're building, investing, or exploring — Aptos has everything you need
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Developers */}
            <Link href="/#developers">
              <Card className="group p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Code className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      For Developers
                    </h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Ready to start building? Access Move docs, tools, and resources to ship your dApp
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Start Building →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Investors */}
            <Link href="/protocols/yields">
              <Card className="group p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      For Investors
                    </h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Discover high-yield opportunities and maximize returns across Aptos DeFi protocols
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Check Out Yields →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Users */}
            <Link href="/portfolio">
              <Card className="group p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      For Users
                    </h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Track your Aptos portfolio and explore the fastest-growing DeFi ecosystem
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Launch Portfolio →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
