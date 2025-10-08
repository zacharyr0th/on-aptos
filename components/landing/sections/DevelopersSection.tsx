"use client";

import { motion } from "framer-motion";
import { BookOpen, Check, Copy, ExternalLink, Github, Terminal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { developerTools } from "@/components/landing/data/landing-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cardEntrance, staggerContainer } from "../shared/animations";
import SectionHeader from "../shared/SectionHeader";

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
    <section
      id="developers"
      className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Build on Aptos"
            description="Everything you need to start building"
          />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Tabs defaultValue="quickstart" className="w-full">
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="quickstart" className="gap-2">
                  <Terminal className="w-4 h-4" />
                  Quick Start
                </TabsTrigger>
                <TabsTrigger value="tools" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Developer Tools
                </TabsTrigger>
              </TabsList>

              {/* Quick Start Tab */}
              <TabsContent value="quickstart" className="mt-0">
                <div className="max-w-4xl mx-auto">
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
                    <div className="p-6 sm:p-8">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                          Create Your First dApp
                        </h3>
                        <p className="text-foreground/70 max-w-2xl mx-auto">
                          Full-stack scaffold with wallet integration and Move smart contracts
                        </p>
                      </div>

                      <div className="bg-slate-950 border-2 border-slate-800 rounded-lg shadow-2xl overflow-hidden mb-6">
                        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <Terminal className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-400 font-mono">bash</span>
                          </div>
                          <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                            aria-label="Copy command"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-sm px-6 py-4 bg-slate-950">
                          <div className="flex items-center">
                            <span className="text-emerald-400 font-bold select-none">$</span>
                            <span className="text-slate-100 ml-3 tracking-wide">
                              npx create-aptos-dapp
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="https://aptos.dev/" target="_blank" rel="noopener noreferrer">
                          <Button variant="default" size="lg" className="gap-2 w-full sm:w-auto">
                            <BookOpen className="w-4 h-4" />
                            View Documentation
                          </Button>
                        </Link>
                        <Link
                          href="https://github.com/aptos-labs/aptos-core"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                            <Github className="w-4 h-4" />
                            GitHub
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Developer Tools Tab */}
              <TabsContent value="tools" className="mt-0">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {developerTools.map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                      <motion.div key={index} variants={cardEntrance}>
                        <Link href={tool.href} target="_blank" rel="noopener noreferrer">
                          <Card className="group relative h-full overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                            <div className="p-5">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                  <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                      {tool.name}
                                    </h4>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-foreground/60 leading-relaxed">
                                {tool.description}
                              </p>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
