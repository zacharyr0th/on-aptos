"use client";

import { ArrowRight, ExternalLink, Wallet, Zap, Shield, Code, TrendingUp, Layers, Users, Globe, GitBranch, BookOpen, FileText, Github, Wrench, Search, Terminal, Key, Settings, Eye, Info, DollarSign, Coins, Bitcoin, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, memo } from "react";
import { defiProtocols } from "@/components/pages/protocols/defi/data/protocols";
import { categories } from "@/components/pages/protocols/defi/data/categories";
import { FilterControls, ProtocolDisplay, StatsSection } from "@/components/pages/protocols/defi/components";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/StatCard";
import type { TokenData } from "@/lib/types/tokens";
import { STABLECOIN_SYMBOLS } from "@/lib/constants/tokens/stablecoins";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

const TokenTreemap = dynamic(() => import("@/components/pages/markets/tokens/TokenTreemap").then(m => m.TokenTreemap));

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second transaction finality with throughput of 100,000+ TPS",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Built with Move programming language for maximum safety and reliability",
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "Rich ecosystem with powerful development tools and comprehensive documentation",
  },
  {
    icon: TrendingUp,
    title: "High Performance",
    description: "Parallel execution engine for unmatched scalability and efficiency",
  },
  {
    icon: Layers,
    title: "Modular Architecture",
    description: "Flexible and composable blockchain infrastructure for any use case",
  },
  {
    icon: Users,
    title: "Thriving Ecosystem",
    description: "Growing community of developers, builders, and innovators",
  },
];

const wallets = [
  { name: "Petra Wallet", description: "The most popular Aptos wallet", href: "https://petra.app" },
  { name: "Martian Wallet", description: "Multi-chain wallet with Aptos support", href: "https://martianwallet.xyz" },
  { name: "Pontem Wallet", description: "Gateway to the Aptos ecosystem", href: "https://pontem.network" },
  { name: "Fewcha Wallet", description: "Secure and user-friendly", href: "https://fewcha.app" },
];

// Removed static protocols - using defiProtocols from data/protocols instead

const bridges = [
  {
    name: "Stargate (LayerZero)",
    description: "Seamless transfers of LayerZero-wrapped stablecoins and OFT assets",
    fee: "~$2-5",
    speed: "1-5 min",
    href: "https://stargate.finance",
  },
  {
    name: "Circle CCTP",
    description: "Native USDC transfers across chains without wrapping",
    fee: "~$1-3",
    speed: "30s-2 min",
    href: "https://www.circle.com/cross-chain-transfer-protocol",
  },
  {
    name: "Wormhole Portal",
    description: "Cross-chain bridge with CCTP integration for native USDC",
    fee: "~$3-7",
    speed: "2-10 min",
    href: "https://portalbridge.com",
  },
];

const exchanges = [
  { name: "Binance", href: "https://www.binance.com", assets: ["APT", "USDC", "USDT"] },
  { name: "Coinbase", href: "https://www.coinbase.com", assets: ["APT", "USDC"] },
  { name: "Bybit", href: "https://www.bybit.com", assets: ["APT", "USDT"] },
  { name: "OKX", href: "https://www.okx.com", assets: ["APT", "USDT"] },
];

const developerTools = [
  {
    name: "Gas Profiler",
    description: "Analyze transaction gas usage with flamegraphs and cost breakdowns",
    href: "https://aptos.dev/gas-profiling/sample-report/",
    icon: TrendingUp,
  },
  {
    name: "Aptos Explorer",
    description: "Explore transactions, accounts, events, and network activities",
    href: "https://explorer.aptoslabs.com/",
    icon: Search,
  },
  {
    name: "Create Aptos DApp",
    description: "Bootstrap dapps with starter templates and Move modules",
    href: "https://github.com/aptos-labs/create-aptos-dapp",
    icon: Terminal,
  },
  {
    name: "Developer Portal",
    description: "API keys, Transaction Stream, and Indexer API access",
    href: "https://developers.aptoslabs.com/",
    icon: Settings,
  },
  {
    name: "Identity Connect",
    description: "Single sign-on with Gmail, Facebook, or Twitter for dapps",
    href: "https://identity-connect.staging.gcp.aptosdev.com/",
    icon: Key,
  },
  {
    name: "Aptos Names Service",
    description: "Human-readable addresses and digital identity framework",
    href: "https://www.aptosnames.com/",
    icon: Users,
  },
  {
    name: "Revela Decompiler",
    description: "Decompile Move bytecode back to source code",
    href: "https://revela.verichains.io/",
    icon: Eye,
  },
  {
    name: "Aptos Assistant",
    description: "AI chatbot for development assistance",
    href: "https://assistant.aptosfoundation.org/",
    icon: Info,
  },
];

const developerResources = [
  {
    name: "Aptos Core",
    description: "Main Aptos blockchain repository",
    href: "https://github.com/aptos-labs/aptos-core",
    type: "GitHub",
  },
  {
    name: "Aptos Developer Documentation",
    description: "Complete developer guide and API reference",
    href: "https://aptos.dev/",
    type: "Docs",
  },
  {
    name: "Move Reference Docs",
    description: "Move programming language documentation",
    href: "https://aptos.dev/reference/move/",
    type: "Docs",
  },
];

function OnboardingPageComponent() {
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [includeStablecoins, setIncludeStablecoins] = useState(true);
  const [includeAPT, setIncludeAPT] = useState(true);
  const [viewMode, setViewMode] = useState<"grid">("grid");
  const [assetValues, setAssetValues] = useState<{
    stables: { value: number; label: string; description: string };
    rwas: { value: number; label: string; description: string };
    btc: { value: number; label: string; description: string };
    tokens: { value: number; label: string; description: string };
  } | null>(null);
  const [isLoadingValues, setIsLoadingValues] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingTokens(true);
      setIsLoadingValues(true);

      // Fetch both APIs in parallel for faster loading
      const [tokensResponse, assetValuesResponse] = await Promise.all([
        fetch("/api/markets/tokens?limit=5000&all=true"),
        fetch("/api/defi/asset-values")
      ]);

      // Process tokens
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        if (tokensData.tokens) {
          // Convert API data format to component format (same as tokens page)
          const processedTokens = tokensData.tokens.map((token: any) => ({
            name: token.name,
            symbol: token.symbol,
            price: token.price ? parseFloat(token.price) : 0,
            marketCap: token.marketCap || 0,
            fdv: token.fullyDilutedValuation || token.marketCap || 0,
            supply: token.supply || 0,
            priceChange: token.priceChange24H || 0,
            category: token.category || "other",
            bridge: token.bridge || null,
            logoUrl: token.logoUrl,
            panoraSymbol: token.panoraSymbol,
            panoraTags: token.panoraTags || [],
            panoraUI: token.panoraUI,
            websiteUrl: token.websiteUrl,
            faAddress: token.faAddress,
            tokenAddress: token.tokenAddress,
            coinGeckoId: token.coinGeckoId,
            rank: token.rank || 0,
            isVerified: token.isVerified || false,
          }));
          setTokens(processedTokens);
        }
      }

      // Process asset values
      if (assetValuesResponse.ok) {
        const assetData = await assetValuesResponse.json();
        setAssetValues(assetData);
      }

    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoadingTokens(false);
      setIsLoadingValues(false);
    }
  };
  
  // Calculate protocol counts per category
  const protocolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(category => {
      if (category !== "All") {
        counts[category] = defiProtocols.filter(p => p.category === category).length;
      }
    });
    return counts;
  }, []);

  // Calculate subcategory counts per category
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    categories.forEach(category => {
      if (category !== "All") {
        counts[category] = {};
        // Get all unique subcategories for this category
        const protocolsInCategory = defiProtocols.filter(p => p.category === category);
        protocolsInCategory.forEach(protocol => {
          // Handle comma-separated subcategories
          const subcategories = protocol.subcategory.split(", ").map(s => s.trim());
          subcategories.forEach(subcategory => {
            if (!counts[category][subcategory]) {
              counts[category][subcategory] = 0;
            }
            counts[category][subcategory]++;
          });
        });
      }
    });
    return counts;
  }, []);

  // STABLE TOKENS - only update when toggles change
  const stableTokens = useMemo(() => {
    if (tokens.length === 0) return [];
    
    let filtered = tokens;
    
    if (!includeStablecoins) {
      filtered = filtered.filter(
        token => !token.symbol || !STABLECOIN_SYMBOLS.includes(token.symbol as any)
      );
    }
    
    if (!includeAPT) {
      filtered = filtered.filter(
        token => token.symbol !== "APT"
      );
    }
    
    // Return the EXACT same reference if no change
    return filtered;
  }, [tokens.length, includeStablecoins, includeAPT]);

  // Calculate metrics based on APT and stablecoin toggles (EXACT COPY FROM TOKENS PAGE)
  const displayMetrics = useMemo(() => {
    if (!tokens.length)
      return {
        marketCap: 0,
        tokenCount: 0,
        averageMarketCap: 0,
        medianMarketCap: 0,
      };

    const relevantTokens = stableTokens;

    // Calculate market caps
    const tokenMarketCaps = relevantTokens
      .map((token) => token.fdv || token.marketCap || 0)
      .filter((cap) => cap > 0);

    // Total market cap
    const totalMarketCap = tokenMarketCaps.reduce((sum, cap) => sum + cap, 0);

    // Token count
    const tokenCount = relevantTokens.length;

    // Average market cap
    const averageMarketCap = tokenCount > 0 ? totalMarketCap / tokenCount : 0;

    // Median market cap
    const sortedCaps = [...tokenMarketCaps].sort((a, b) => a - b);
    const medianMarketCap =
      sortedCaps.length > 0
        ? sortedCaps.length % 2 === 0
          ? (sortedCaps[sortedCaps.length / 2 - 1] + sortedCaps[sortedCaps.length / 2]) / 2
          : sortedCaps[Math.floor(sortedCaps.length / 2)]
        : 0;

    return {
      marketCap: totalMarketCap,
      tokenCount,
      averageMarketCap,
      medianMarketCap,
    };
  }, [tokens, stableTokens]);
  
  // Format value for display
  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-0">
          <div className="container mx-auto text-center">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
                Welcome to Aptos
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                Fast, secure, developer-friendly blockchain. Explore DeFi and track your portfolio.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/portfolio">
                  <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
                    Launch App
                  </button>
                </Link>
                <Link href="#features">
                  <button className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Asset Value Cards Section */}
        <section className="py-12 px-0 bg-muted/10">
          <div className="container mx-auto">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stablecoins Card */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img src="/icons/stables/usdc.png" alt="USDC" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/stables/usdt.png" alt="USDT" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/stables/usde.png" alt="USDe" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/stables/USDA.png" alt="USDA" className="w-8 h-8 rounded-full border-2 border-background" />
                    </div>
                    <Badge variant="outline" className="text-xs">Live</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Stablecoins</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(assetValues?.stables.value || 256000000)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">USDC, USDT, USDe, USDA & more</p>
                  </div>
                </Card>

                {/* RWAs Card */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img src="/icons/rwas/blackrock.webp" alt="BlackRock" className="w-8 h-8 rounded-full border-2 border-background bg-white" />
                      <img src="/icons/rwas/ft.webp" alt="Franklin Templeton" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/rwas/ondo.webp" alt="Ondo" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/rwas/pact.webp" alt="Pact" className="w-8 h-8 rounded-full border-2 border-background" />
                    </div>
                    <Badge variant="outline" className="text-xs">Growing</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Real World Assets</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(assetValues?.rwas.value || 12000000)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">BlackRock, Franklin Templeton, Ondo</p>
                  </div>
                </Card>

                {/* BTC Card */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img src="/icons/btc/echo.webp" alt="aBTC" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/btc/stakestone.webp" alt="SBTC" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/btc/okx.webp" alt="xBTC" className="w-8 h-8 rounded-full border-2 border-background bg-white" />
                      <img src="/icons/btc/WBTC.webp" alt="WBTC" className="w-8 h-8 rounded-full border-2 border-background bg-white" />
                    </div>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Bitcoin</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(assetValues?.btc.value || 8500000)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">aBTC, SBTC, xBTC & more</p>
                  </div>
                </Card>

                {/* Total Tokens Card */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex -space-x-2">
                      <img src="/icons/protocols/echelon.avif" alt="Echelon" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/protocols/panora.webp" alt="Panora" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/protocols/thala.avif" alt="Thala" className="w-8 h-8 rounded-full border-2 border-background" />
                      <img src="/icons/protocols/merkle.webp" alt="Merkle" className="w-8 h-8 rounded-full border-2 border-background" />
                    </div>
                    <Badge variant="outline" className="text-xs">TVL</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Value Locked</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingValues ? (
                        <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                      ) : (
                        formatValue(assetValues?.tokens.value || 650000000)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Across all protocols</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Token Market Overview */}
        <section className="py-16 px-0 bg-muted/30">
          <div className="container mx-auto">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                    Token Market Overview
                  </h2>
                </div>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  Comprehensive view of the Aptos token ecosystem with real-time market data
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6 bg-card hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-foreground/80">
                      {includeAPT ? "Total Market Cap" : "Non-APT Market Cap"}
                    </h3>
                    <Badge variant="secondary" className="px-3 py-1">
                      {includeAPT ? "Total" : "Non-APT"}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(displayMetrics.marketCap)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {includeAPT ? "Combined market capitalization of all tokens" : "Market capitalization excluding APT"}
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-foreground/80">
                      Token Count
                    </h3>
                    <Badge variant="outline" className="px-3 py-1">
                      Active
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatNumber(displayMetrics.tokenCount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total number of tokens in the ecosystem
                  </p>
                </div>
              </Card>
            </div>


              {/* Treemap */}
              {loadingTokens ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-foreground/70">Loading token data...</p>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <TokenTreemap tokens={stableTokens} />
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Blockchain Overview Section */}
        <section className="py-16 px-0">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                The Aptos Blockchain
              </h2>
              <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
                Scalable, safe, reliable blockchain infrastructure
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="prose prose-lg max-w-none text-foreground/80">
                <p className="text-lg leading-relaxed mb-8">
                  Blockchain infrastructure needs to be trusted, scalable, and cost-efficient for mass adoption. 
                  Aptos addresses these challenges with innovations in consensus, smart contracts, security, and performance.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Move Language</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Native Move integration for secure smart contract execution with formal verification.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Flexible Keys</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Hybrid custodial options with transaction transparency for safer user experiences.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Parallel Execution</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Concurrent transaction processing stages for high throughput and low latency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Code className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">True Atomicity</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Support for complex transactions without developer limitations or pre-declaration.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Modular Design</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Client flexibility with instant upgrades and embedded change management.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Horizontal Scaling</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Internal validator sharding for unlimited throughput scalability.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 px-0 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Why Choose Aptos?
              </h2>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto">
                Performance, security, and developer experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="p-6 rounded-lg bg-card hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 p-3 mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Wallets Section */}
        <section className="py-16 px-0">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Connect Your Wallet
              </h2>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto">
                Connect with trusted Aptos wallets
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {wallets.map((wallet, index) => (
                <Link key={index} href={wallet.href} target="_blank" rel="noopener noreferrer">
                  <div className="p-4 rounded-lg bg-card  hover:shadow-md transition-shadow text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{wallet.name}</h3>
                    <p className="text-sm text-foreground/70">{wallet.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Protocols Section with Full Table */}
        <section className="py-16 px-0 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                All DeFi Protocols on Aptos
              </h2>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto mb-8">
                Complete ecosystem of {defiProtocols.length}+ protocols across all categories
              </p>
            </div>
            
            {/* Use the actual Stats, FilterControls and ProtocolDisplay components */}
            <div className="max-w-5xl mx-auto">
              {/* DeFi Stats Section with TVL, Volume, Fees */}
              <StatsSection
                protocolCount={defiProtocols.length}
                filteredCount={(() => {
                  return defiProtocols.filter((protocol) => {
                    const matchesCategory = selectedCategory === "All" || protocol.category === selectedCategory;
                    const matchesSubcategory = !selectedSubcategory || 
                      protocol.subcategory.split(", ").map(s => s.trim()).includes(selectedSubcategory);
                    return matchesCategory && matchesSubcategory;
                  }).length;
                })()}
                totalCount={defiProtocols.length}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
              />
              <FilterControls
                categories={categories}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onCategoryChange={setSelectedCategory}
                onSubcategoryChange={setSelectedSubcategory}
                protocolCounts={protocolCounts}
                subcategoryCounts={subcategoryCounts}
              />
              
              <div className="mt-6">
                <ProtocolDisplay
                  filteredProtocols={(() => {
                    return defiProtocols.filter((protocol) => {
                      const matchesCategory = selectedCategory === "All" || protocol.category === selectedCategory;
                      const matchesSubcategory = !selectedSubcategory || 
                        protocol.subcategory.split(", ").map(s => s.trim()).includes(selectedSubcategory);
                      return matchesCategory && matchesSubcategory;
                    });
                  })()}
                  onClearFilters={() => {
                    setSelectedCategory("All");
                    setSelectedSubcategory(undefined);
                  }}
                />
              </div>
            </div>
            
          </div>
        </section>

        {/* Bridging Guide Section */}
        <section className="py-16 px-0">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <GitBranch className="w-6 h-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  The Aptos Bridging Guide
                </h2>
              </div>
              <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                Fast, secure bridging solutions for smooth onboarding to Aptos.
              </p>
              <div className="mt-6 p-4 rounded-lg bg-primary/10  max-w-5xl mx-auto">
                <p className="text-primary font-medium">
                  <strong>$1.1B+ stablecoin circulation</strong> across multiple secure bridging options.
                </p>
              </div>
            </div>

            <div className="grid gap-4 max-w-5xl mx-auto mb-8">
              {bridges.map((bridge, index) => (
                <Link key={index} href={bridge.href} target="_blank" rel="noopener noreferrer">
                  <div className="p-6 rounded-lg bg-card  hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{bridge.name}</h3>
                        <p className="text-sm text-foreground/70 mb-3">{bridge.description}</p>
                        <div className="flex gap-4 text-xs text-foreground/60">
                          <span>Fee: {bridge.fee}</span>
                          <span>Speed: {bridge.speed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <div className="p-4 rounded-lg bg-secondary/10 max-w-5xl mx-auto">
                <p className="text-sm text-foreground/70">
                  <strong>Best Practices:</strong> Verify contracts, start small, prefer native tokens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CEX Section - Separate from DeFi */}
        <section className="py-16 px-0 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Centralized Exchange Support
              </h2>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto">
                Buy APT and stablecoins directly from major exchanges
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {exchanges.map((exchange, index) => (
                <Link key={index} href={exchange.href} target="_blank" rel="noopener noreferrer">
                  <div className="p-4 rounded-lg bg-card  hover:shadow-md transition-shadow text-center">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{exchange.name}</h3>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {exchange.assets.map((asset, assetIndex) => (
                        <span key={assetIndex} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Developer Tooling */}
        <section className="py-16 px-0">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Wrench className="w-6 h-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Developer Tooling
                </h2>
              </div>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto">
                Essential tools for building, testing, and deploying on Aptos
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {developerTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <Link key={index} href={tool.href} target="_blank" rel="noopener noreferrer">
                    <div className="p-4 rounded-lg bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm mb-1">{tool.name}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed">{tool.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Developer Resources */}
        <section className="py-16 px-0 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Developer Resources
                </h2>
              </div>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto">
                Documentation and guides for building on Aptos
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {developerResources.map((resource, index) => {
                const getIcon = (type: string) => {
                  switch (type) {
                    case "GitHub": return Github;
                    case "PDF": return FileText;
                    default: return BookOpen;
                  }
                };
                const Icon = getIcon(resource.type);
                
                return (
                  <Link key={index} href={resource.href} target="_blank" rel="noopener noreferrer">
                    <div className="p-6 rounded-lg bg-card  hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">{resource.name}</h3>
                            <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              {resource.type}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/70">{resource.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="text-center mt-8">
              <div className="p-4 rounded-lg bg-primary/10 max-w-5xl mx-auto">
                <p className="text-primary font-medium">
                  <strong>Start Building:</strong> Move makes it safe to build scalable apps. Check the docs!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-0">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Ready to Start Building?
              </h2>
              <p className="text-lg text-foreground/70 mb-8">
                Join the builders on Aptos
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/portfolio">
                  <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
                    Launch Portfolio Tracker
                  </button>
                </Link>
                <Link href="/protocols/defi">
                  <button className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors">
                    Explore DeFi
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const OnboardingPage = memo(OnboardingPageComponent);