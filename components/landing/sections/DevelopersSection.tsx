"use client";

import { ExternalLink, BookOpen, Terminal, Github, FileText, Users, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { developerTools, developerResources } from "@/components/landing/data/landing-data";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function DevelopersSection() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("npx create-aptos-dapp");
      setCopied(true);
      toast.success("Copied to clipboard!", {
        description: "npx create-aptos-dapp",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <section id="developers" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: -10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: "spring", stiffness: 70, damping: 16 }
            }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Build on Aptos
            </h2>
            <p className="text-base sm:text-lg text-foreground/60 max-w-2xl mx-auto leading-relaxed">
              Professional tools and comprehensive documentation for Move development
            </p>
          </motion.div>

          {/* Quick Start */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: "spring", stiffness: 60, damping: 18 }
            }}
          >
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-border bg-card/50 backdrop-blur-sm">
                <div className="p-8 md:p-10">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      Create a dApp with a Single Command
                    </h3>
                    <p className="text-foreground/60 leading-relaxed max-w-2xl mx-auto">
                      Bootstrap a full-stack Aptos dApp with wallet integration and Move modules
                    </p>
                  </div>

                  <div className="bg-black dark:bg-gray-950 border border-gray-800 rounded-lg shadow-lg mb-6 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">terminal</span>
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                        aria-label="Copy command"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-sm px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-green-400">$</span>
                        <span className="text-gray-100 ml-2">npx create-aptos-dapp</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="https://aptos.dev/" target="_blank" rel="noopener noreferrer">
                      <Button variant="default" className="gap-2 w-full sm:w-auto">
                        <BookOpen className="w-4 h-4" />
                        Documentation
                      </Button>
                    </Link>
                    <Link href="https://github.com/aptos-labs/aptos-core" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="gap-2 w-full sm:w-auto">
                        <Github className="w-4 h-4" />
                        GitHub
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Developer Tools */}
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
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Developer Tools</h3>
              <p className="text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                Everything you need to build, debug, and ship production-ready applications
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {developerTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 50, scale: 0.85 },
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
                  <Link href={tool.href} target="_blank" rel="noopener noreferrer">
                    <Card className="group relative h-full overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card via-card to-muted/20">
                      <div className="p-6 md:p-8">
                        <div className="flex items-start gap-5">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                              <Icon className="w-7 h-7 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {tool.name}
                              </h4>
                              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                            </div>
                            <p className="text-sm text-foreground/70 leading-relaxed">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
