"use client";

import { ArrowRight, ExternalLink, Wallet, Zap, Shield, Code, TrendingUp, Layers, Users, Globe, GitBranch, BookOpen, FileText, Github, Wrench, Search, Terminal, Key, Settings, Eye, Info, DollarSign, Coins, Bitcoin, Package, Menu, X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, memo, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  { name: "Petra", description: "The most popular Aptos wallet", href: "https://petra.app/", logo: "/icons/petra.webp" },
  { name: "Backpack", description: "Multi-chain wallet with Aptos support", href: "https://chromewebstore.google.com/detail/backpack/aflkmfhebedbjioipglgcbcmnbpgliof", logo: "/icons/cex/backpack.jpg" },
  { name: "Aptos Connect", description: "Official Aptos wallet adapter", href: "https://aptosconnect.app/", logo: "/icons/apt.png" },
];

// Removed static protocols - using defiProtocols from data/protocols instead

const bridges = [
  {
    name: "Stargate (LayerZero)",
    description: "Seamless transfers of LayerZero-wrapped stablecoins and Omnichain Fungible Tokens (OFT assets)",
    href: "https://stargate.finance",
    logo: "/icons/protocols/lz.png",
    bridgeTime: "1-5 min",
    fees: "~0.06%",
    networks: "39+",
    protocol: "LAYERZERO",
    status: "Live",
  },
  {
    name: "Circle CCTP",
    description: "Facilitates native USDC transfers across 10+ blockchain networks",
    href: "https://www.circle.com/cross-chain-transfer-protocol",
    logo: "/icons/stables/usdc.webp",
    bridgeTime: "10-20 min",
    fees: "0%",
    networks: "10+",
    protocol: "CIRCLE NATIVE",
    status: "Live",
  },
  {
    name: "Wormhole Portal",
    description: "Cross-chain bridge with CCTP integration for native USDC, accessible via Stargate",
    href: "https://portalbridge.com",
    logo: "/icons/protocols/wormhole.png",
    bridgeTime: "5-15 min",
    fees: "~0.1%",
    networks: "30+",
    protocol: "WORMHOLE",
    status: "Live",
  },
  {
    name: "Echo aBTC Bridge",
    description: "Allows bridging Bitcoin onto Aptos as aBTC, powered by the BSquared Network",
    href: "https://www.echo-protocol.xyz",
    logo: "/icons/btc/echo.webp",
    bridgeTime: "15-30 min",
    fees: "~0.3%",
    networks: "5+",
    protocol: "BSQUARED",
    status: "Live",
  },
  {
    name: "Gas.zip",
    description: "Integrated with Stargate, quickly 'refuels' Aptos wallets with APT tokens for covering gas fees",
    href: "https://gas.zip",
    logo: "/icons/protocols/gas-zip.png",
    bridgeTime: "1-5 min",
    fees: "Variable",
    networks: "Multiple",
    protocol: "GAS REFUEL",
    status: "Live",
  },
  {
    name: "Zach's Bridging Guide",
    description: "Complete guide to bridging assets onto Aptos with detailed instructions and best practices",
    href: "https://x.com/zacharyr0th/status/1915031084976451596",
    logo: "/icons/apt.png",
    bridgeTime: "N/A",
    fees: "N/A",
    networks: "Guide",
    protocol: "EDUCATIONAL",
    status: "Guide",
  },
];

const exchanges = [
  // Coinbase (US)
  { region: "US", name: "Coinbase", chain: "Aptos", usdt: "N", usdc: "Y", link: "https://www.coinbase.com", logo: "/icons/cex/coinbase.web.png" },
  { region: "US", name: "Coinbase", chain: "Solana", usdt: "N", usdc: "Y", link: "https://www.coinbase.com" },
  { region: "US", name: "Coinbase", chain: "ETH", usdt: "Y", usdc: "Y", link: "https://www.coinbase.com" },
  { region: "US", name: "Coinbase", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.coinbase.com" },

  // Upbit (KR)
  { region: "KR", name: "Upbit", chain: "Aptos", usdt: "Y", usdc: "N", link: "https://upbit.com", logo: "/icons/cex/upbit.jpg" },
  { region: "KR", name: "Upbit", chain: "Solana", usdt: "N", usdc: "Y", link: "https://upbit.com" },
  { region: "KR", name: "Upbit", chain: "Tron", usdt: "Y", usdc: "N", link: "https://upbit.com" },
  { region: "KR", name: "Upbit", chain: "Base", usdt: "N", usdc: "N", link: "https://upbit.com" },

  // Bithumb (KR)
  { region: "KR", name: "Bithumb", chain: "Solana", usdt: "", usdc: "", link: "https://www.bithumb.com" },

  // Binance (Global)
  { region: "Global", name: "Binance", chain: "Aptos", usdt: "Y", usdc: "Y", link: "https://www.binance.com", logo: "/icons/cex/binance.webp" },
  { region: "Global", name: "Binance", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.binance.com" },
  { region: "Global", name: "Binance", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.binance.com" },
  { region: "Global", name: "Binance", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.binance.com" },

  // Bybit (Global)
  { region: "Global", name: "Bybit", chain: "Aptos", usdt: "Y", usdc: "Y", link: "https://www.bybit.com", logo: "/icons/cex/bybit.jpg" },
  { region: "Global", name: "Bybit", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.bybit.com" },
  { region: "Global", name: "Bybit", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.bybit.com" },
  { region: "Global", name: "Bybit", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.bybit.com" },

  // OKX (Global)
  { region: "Global", name: "OKX", chain: "Aptos", usdt: "Y", usdc: "Y", link: "https://www.okx.com", logo: "/icons/cex/okx.jpg" },
  { region: "Global", name: "OKX", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.okx.com" },
  { region: "Global", name: "OKX", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.okx.com" },
  { region: "Global", name: "OKX", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.okx.com" },

  // Bitget (Global)
  { region: "Global", name: "Bitget", chain: "Aptos", usdt: "Y", usdc: "Y", link: "https://www.bitget.com", logo: "/icons/cex/bitget.jpg" },
  { region: "Global", name: "Bitget", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.bitget.com" },
  { region: "Global", name: "Bitget", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.bitget.com" },
  { region: "Global", name: "Bitget", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.bitget.com" },

  // MEXC (Global)
  { region: "Global", name: "MEXC", chain: "Aptos", usdt: "Y", usdc: "Y", link: "https://www.mexc.com", logo: "/icons/cex/mexc.webp" },
  { region: "Global", name: "MEXC", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.mexc.com" },
  { region: "Global", name: "MEXC", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.mexc.com" },
  { region: "Global", name: "MEXC", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.mexc.com" },

  // Bitfinex (Global)
  { region: "Global", name: "Bitfinex", chain: "Aptos", usdt: "Y", usdc: "N", link: "https://www.bitfinex.com", logo: "/icons/cex/bitfinex.webp" },
  { region: "Global", name: "Bitfinex", chain: "Solana", usdt: "Y", usdc: "N", link: "https://www.bitfinex.com" },
  { region: "Global", name: "Bitfinex", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.bitfinex.com" },

  // KuCoin (Global)
  { region: "Global", name: "KuCoin", chain: "Aptos", usdt: "Y", usdc: "N", link: "https://www.kucoin.com", logo: "/icons/cex/kucoin.jpg" },
  { region: "Global", name: "KuCoin", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.kucoin.com" },
  { region: "Global", name: "KuCoin", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.kucoin.com" },

  // Backpack (Global)
  { region: "Global", name: "Backpack", chain: "Aptos", usdt: "N", usdc: "Y", link: "https://backpack.exchange", logo: "/icons/cex/backpack.jpg" },
  { region: "Global", name: "Backpack", chain: "Solana", usdt: "N", usdc: "Y", link: "https://backpack.exchange" },
  { region: "Global", name: "Backpack", chain: "Tron", usdt: "N", usdc: "N", link: "https://backpack.exchange" },

  // Flipster (KR)
  { region: "KR", name: "Flipster", chain: "Aptos", usdt: "Y", usdc: "N", link: "https://flipster.io", logo: "/icons/cex/flipster.jpg" },
  { region: "KR", name: "Flipster", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://flipster.io" },
  { region: "KR", name: "Flipster", chain: "Tron", usdt: "Y", usdc: "N", link: "https://flipster.io" },
  { region: "KR", name: "Flipster", chain: "Base", usdt: "N", usdc: "Y", link: "https://flipster.io" },

  // Gate.io
  { region: "Global", name: "Gate.io", chain: "Aptos", usdt: "Y", usdc: "Y", link: "https://www.gate.io", logo: "/icons/cex/gate.jpg" },
  { region: "Global", name: "Gate.io", chain: "Solana", usdt: "Y", usdc: "Y", link: "https://www.gate.io" },
  { region: "Global", name: "Gate.io", chain: "Tron", usdt: "Y", usdc: "N", link: "https://www.gate.io" },
  { region: "Global", name: "Gate.io", chain: "Base", usdt: "N", usdc: "Y", link: "https://www.gate.io" },
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

const navigationSections = [
  { id: "overview", label: "Overview" },
  { id: "why-aptos", label: "Why Aptos" },
  { id: "getting-started", label: "Get Started" },
  { id: "defi", label: "DeFi" },
  { id: "tokens", label: "Markets" },
  { id: "developers", label: "Developers" },
  { id: "community", label: "Community" },
];

function OnboardingPageComponent() {

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [includeStablecoins, setIncludeStablecoins] = useState(true);
  const [includeAPT, setIncludeAPT] = useState(true);
  const [assetValues, setAssetValues] = useState<{
    stables: { value: number; label: string; description: string };
    rwas: { value: number; label: string; description: string };
    btc: { value: number; label: string; description: string };
    tokens: { value: number; label: string; description: string };
  } | null>(null);
  const [isLoadingValues, setIsLoadingValues] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0);
  const [animatedValues, setAnimatedValues] = useState({
    stables: 0,
    rwas: 0,
    btc: 0,
    tokens: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Animate values when assetValues change
  useEffect(() => {
    if (!assetValues) return;

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setAnimatedValues({
        stables: Math.floor(assetValues.stables.value * easeOutProgress),
        rwas: Math.floor(assetValues.rwas.value * easeOutProgress),
        btc: Math.floor(assetValues.btc.value * easeOutProgress),
        tokens: Math.floor(assetValues.tokens.value * easeOutProgress),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        // Set final exact values
        setAnimatedValues({
          stables: assetValues.stables.value,
          rwas: assetValues.rwas.value,
          btc: assetValues.btc.value,
          tokens: assetValues.tokens.value,
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [assetValues]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationSections.map(section => document.getElementById(section.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navigationSections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingTokens(true);
      setIsLoadingValues(true);
      setError(null);

      // Fetch both APIs in parallel for faster loading - REDUCED TOKEN LIMIT
      const [tokensResponse, assetValuesResponse] = await Promise.all([
        fetch("/api/markets/tokens?limit=100&all=true"),
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
          // Store the total token count from Panora's API
          setTotalTokenCount(tokensData.totalTokens || 0);
        }
      } else {
        throw new Error("Failed to fetch tokens");
      }

      // Process asset values
      if (assetValuesResponse.ok) {
        const assetData = await assetValuesResponse.json();
        setAssetValues(assetData);
      } else {
        throw new Error("Failed to fetch asset values");
      }

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoadingTokens(false);
      setIsLoadingValues(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = 80;
      const sectionPosition = section.offsetTop - offset;
      window.scrollTo({ top: sectionPosition, behavior: "smooth" });
      setIsNavOpen(false);
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
    <div className="min-h-screen">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 bg-background/30 backdrop-blur-lg rounded-full px-2 py-2 border border-border/30">
              {navigationSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-background/80 text-foreground font-medium shadow-sm"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="lg:hidden p-2 text-foreground hover:bg-muted rounded-md"
            >
              {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isNavOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                {navigationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="relative">
        {/* Hero Section */}
        <section id="overview" className="pt-16 pb-20 px-0 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80 pointer-events-none" />

          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Main heading */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground leading-tight tracking-tight">
                Welcome to the
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Aptos Ecosystem
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed">
                Explore wallets, DeFi, and everything you need to start building or investing on the fastest, most secure blockchain
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/portfolio">
                  <button className="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                    <span className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      View Portfolio
                    </span>
                  </button>
                </Link>
                <Link href="#defi">
                  <button className="px-8 py-4 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-all hover:shadow-md">
                    Explore DeFi
                  </button>
                </Link>
              </div>

              {/* Asset Value Cards - Integrated into Hero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {/* Stablecoins Card */}
                <Link href="/markets/stables">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
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
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {isLoadingValues ? (
                          <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                        ) : (
                          formatValue(animatedValues.stables)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">USDC, USDT, USDe, USDA</p>
                    </div>
                  </Card>
                </Link>

                {/* RWAs Card */}
                <Link href="/markets/rwas">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
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
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {isLoadingValues ? (
                          <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                        ) : (
                          formatValue(animatedValues.rwas)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">BlackRock, Franklin Templeton</p>
                    </div>
                  </Card>
                </Link>

                {/* BTC Card */}
                <Link href="/markets/bitcoin">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
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
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {isLoadingValues ? (
                          <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                        ) : (
                          formatValue(animatedValues.btc)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">aBTC, SBTC, xBTC</p>
                    </div>
                  </Card>
                </Link>

                {/* TVL Card */}
                <Link href="/protocols/defi">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50">
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
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {isLoadingValues ? (
                          <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
                        ) : (
                          formatValue(animatedValues.tokens)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Across all protocols</p>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Aptos Section */}
        <section id="why-aptos" className="py-20 px-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-12 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Why Aptos?
                </h2>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  Aptos is designed for the next generation of blockchain applications — <strong className="text-foreground">lightning fast</strong>, <strong className="text-foreground">secure by design</strong>, <strong className="text-foreground">developer-friendly</strong>, and <strong className="text-foreground">endlessly scalable</strong>.
                </p>
              </div>

              {/* Feature Cards - Grid Layout */}
              <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="p-6 bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Lightning Fast</h3>
                        <p className="text-sm text-foreground/70">Experience sub-second finality and over 100,000 transactions per second — built for instant global scale</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Secure by Design</h3>
                        <p className="text-sm text-foreground/70">Built with the Move programming language to prevent common vulnerabilities and protect your assets</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Massively Scalable</h3>
                        <p className="text-sm text-foreground/70">Parallel execution engine processes thousands of transactions simultaneously without compromising performance</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Row 2 */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="p-6 bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Code className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Developer Friendly</h3>
                        <p className="text-sm text-foreground/70">Build faster with comprehensive tools, SDKs, and documentation designed for modern development workflows</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Modular & Composable</h3>
                        <p className="text-sm text-foreground/70">Flexible infrastructure lets you build exactly what you need, from DeFi to gaming to enterprise solutions</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Thriving Community</h3>
                        <p className="text-sm text-foreground/70">Join thousands of builders, investors, and innovators shaping the future of decentralized applications</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Network Stats */}
              <div className="mt-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100k+</div>
                    <div className="text-sm text-foreground/70">Transactions Per Second</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;1s</div>
                    <div className="text-sm text-foreground/70">Transaction Finality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">Move</div>
                    <div className="text-sm text-foreground/70">Programming Language</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">$0.001</div>
                    <div className="text-sm text-foreground/70">Average Transaction Cost</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section id="getting-started" className="py-20 px-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Getting Started on Aptos
                </h2>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  Get your wallet set up, acquire APT, and start exploring the ecosystem in minutes
                </p>
              </div>

              {/* Wallets First */}
              <div className="mb-20">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Choose Your Wallet</h3>
                <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                  Start by installing a secure wallet to manage your assets and connect to Aptos dApps
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {wallets.map((wallet, index) => (
                    <Link key={index} href={wallet.href} target="_blank" rel="noopener noreferrer">
                      <Card className="group relative p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
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
                                className={`w-full h-full object-contain ${wallet.name === "Aptos Connect" ? "dark:invert" : ""}`}
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
                  ))}
                </div>

                {/* Quick Setup Guide */}
                <Card className="bg-gradient-to-br from-primary/5 to-card border-primary/20">
                  <div className="p-6">
                    <h4 className="font-bold text-foreground mb-3 text-center">Get started in minutes</h4>
                    <p className="text-sm text-center text-foreground/70 max-w-3xl mx-auto">
                      Install Petra, create your wallet, add APT from an exchange or faucet, and you're ready to explore DeFi on Aptos
                    </p>
                  </div>
                </Card>
              </div>

              {/* Exchanges */}
              <div className="mb-20">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Buy APT on Exchanges</h3>
                <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                  Trade Aptos tokens globally on leading exchanges like Coinbase, Binance, and Upbit with instant access to liquidity in USD, USDC, and USDT
                </p>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {exchanges.filter(ex => ex.chain === "Aptos").map((exchange, index) => {
                  const content = (
                    <Card className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
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
                              <img src={exchange.logo} alt={exchange.name} className="w-full h-full object-contain" />
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

                <p className="text-xs text-center text-muted-foreground mt-6">
                  Available on 15+ major exchanges. Fees and availability vary by region.
                </p>
              </div>
            </div>

              {/* Bridges */}
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Bridge Assets to Aptos</h3>
                <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                  Transfer assets from Ethereum, Solana, and other chains using secure, audited bridges powered by LayerZero, Circle CCTP, and Wormhole
                </p>

              {/* Bridge Comparison Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {bridges.filter(b => b.status === "Live").map((bridge, index) => (
                  <Link key={index} href={bridge.href} target="_blank" rel="noopener noreferrer">
                    <Card className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      {/* Status Badge */}
                      <Badge variant="default" className="absolute top-3 right-3 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        {bridge.status}
                      </Badge>

                      <div className="flex flex-col space-y-4">
                        {/* Logo and Name */}
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md flex items-center justify-center flex-shrink-0">
                            <img src={bridge.logo} alt={bridge.name} className="w-full h-full object-contain" />
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
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Time</p>
                            <p className="text-sm font-semibold text-foreground">{bridge.bridgeTime}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Fees</p>
                            <p className="text-sm font-semibold text-foreground">{bridge.fees}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Networks</p>
                            <p className="text-sm font-semibold text-foreground">{bridge.networks}</p>
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
                {bridges.filter(b => b.status === "Guide").map((bridge, index) => (
                  <Link key={`guide-${index}`} href={bridge.href} target="_blank" rel="noopener noreferrer">
                    <Card className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-primary/5 to-card border-2 border-primary/20 hover:border-primary/40">
                      <Badge variant="default" className="absolute top-3 right-3 text-xs">
                        Guide
                      </Badge>

                      <div className="flex flex-col items-center text-center space-y-4 justify-center h-full">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 p-3 flex items-center justify-center">
                          <img src={bridge.logo} alt={bridge.name} className="w-full h-full object-contain dark:invert" />
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

                <p className="text-xs text-center text-muted-foreground mt-6">
                  Bridge times and fees vary by protocol. Always verify destination addresses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Explore DeFi Section */}
        <section id="defi" className="py-20 px-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Explore DeFi on Aptos
                </h2>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  Trade, lend, borrow, and earn yield with lightning-fast transactions and minimal fees
                </p>
              </div>

              {/* Trading Protocols */}
              <div className="mb-20">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Trading & DEXs</h3>
                <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                  Swap tokens, provide liquidity, and trade on decentralized exchanges with zero MEV risk
                </p>
              </div>
              {/* Benefits Callout */}
              <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-4">Why Trade on Aptos?</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">No MEV / Sandwich Attacks</h4>
                        <p className="text-xs text-muted-foreground">Fair transaction ordering prevents frontrunning and MEV extraction</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">Low, Fixed Network Fees</h4>
                        <p className="text-xs text-muted-foreground">Predictable costs with fees priced in USD, paid in APT</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">Insanely Fast Swaps</h4>
                        <p className="text-xs text-muted-foreground">Sub-second finality means instant swap confirmation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defiProtocols.filter(p => p.category === "Trading" || p.category === "Multiple").map((protocol, idx) => {
                  const content = (
                    <Card className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0">
                            <img
                              src={protocol.logo}
                              alt={protocol.title}
                              className="w-full h-full object-contain"
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

              {/* Credit Protocols */}
              <div className="mb-20">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Lending & Borrowing</h3>
                <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                  Supply assets to earn interest or borrow against your collateral — all secured by audited smart contracts
                </p>

              {/* How DeFi Lending Works */}
              <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-3">How DeFi Lending Works</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Supply assets to earn interest from borrowers, or use your crypto as collateral to borrow other assets. All lending is overcollateralized and governed by smart contracts, ensuring transparency and security on Aptos.
                  </p>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defiProtocols.filter(p => p.category === "Credit").map((protocol, idx) => {
                  const content = (
                    <Card className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0">
                            <img
                              src={protocol.logo}
                              alt={protocol.title}
                              className="w-full h-full object-contain"
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
              </div>

              {/* Yield Protocols */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Yield & Staking</h3>
                <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                  Maximize returns with auto-compounding vaults, liquid staking, and optimized yield strategies
                </p>

              {/* Yield Strategies Explainer */}
              <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-3">Maximize Your Returns</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                    Yield protocols on Aptos offer auto-compounding strategies, liquid staking derivatives, and optimized vault strategies to maximize your returns while maintaining security through audited smart contracts.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
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
                </div>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defiProtocols.filter(p => p.category === "Yield").map((protocol, idx) => {
                  const content = (
                    <Card className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0">
                            <img
                              src={protocol.logo}
                              alt={protocol.title}
                              className="w-full h-full object-contain"
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
              </div>
            </div>
          </div>
        </section>

        {/* Token Market Overview */}
        <section id="tokens" className="py-16 px-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <div className="max-w-6xl mx-auto">
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
                    {formatNumber(totalTokenCount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total number of tokens in the ecosystem
                  </p>
                </div>
              </Card>
            </div>


              {/* Treemap */}
              {error ? (
                <div className="flex items-center justify-center py-20">
                  <Card className="p-8 max-w-md">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <X className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Failed to load data</h3>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                      </div>
                      <button
                        onClick={fetchInitialData}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </Card>
                </div>
              ) : loadingTokens ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-foreground/70">Loading token data...</p>
                  </div>
                </div>
              ) : tokens.length > 0 ? (
                <div className="w-full">
                  <TokenTreemap tokens={stableTokens} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <p className="text-foreground/70">No token data available</p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Developer Section */}
        <section id="developers" className="py-20 px-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  For Developers
                </h2>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  Build safer, faster apps with Move. Access open-source tools, APIs, and comprehensive guides to launch in days, not months.
                </p>
              </div>

              {/* Developer Tools Carousel */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Developer Tools
                </h3>
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 3000,
                    }),
                  ]}
                  className="w-full"
                >
                  <CarouselContent>
                    {developerTools.map((tool, index) => {
                      const Icon = tool.icon;
                      return (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/4">
                          <Link href={tool.href} target="_blank" rel="noopener noreferrer">
                            <Card className="group p-6 h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:scale-105">
                              <div className="space-y-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                                  <Icon className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                                    {tool.name}
                                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </h4>
                                  <p className="text-sm text-foreground/70 leading-relaxed">
                                    {tool.description}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </Carousel>
              </div>

              {/* Documentation & Guides - Static */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Documentation &amp; Guides
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
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
                        <Card className="group p-6 h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:scale-105">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                                <Icon className="w-7 h-7 text-primary" />
                              </div>
                              <Badge variant="secondary" className="text-xs font-medium">
                                {resource.type}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                                {resource.name}
                                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </h4>
                              <p className="text-sm text-foreground/70 leading-relaxed">
                                {resource.description}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* CTA Banner */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Ready to Start Building?
                  </h3>
                  <p className="text-lg text-foreground/70 mb-6">
                    Move makes it safe to build scalable apps. Check out the docs and start developing today!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="https://aptos.dev/" target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="gap-2">
                        <BookOpen className="w-5 h-5" />
                        View Documentation
                      </Button>
                    </Link>
                    <Link href="https://github.com/aptos-labs/create-aptos-dapp" target="_blank" rel="noopener noreferrer">
                      <Button size="lg" variant="outline" className="gap-2">
                        <Terminal className="w-5 h-5" />
                        Create a DApp
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section id="community" className="py-16 px-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ExternalLink className="w-6 h-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Community
                </h2>
              </div>
              <p className="text-lg text-foreground/70 max-w-5xl mx-auto">
                Connect with the global Aptos community and access official resources
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Official Links Column */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Official Links
                  </h3>
                  <div className="space-y-3">
                    <Link href="https://aptoslabs.com/" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Labs Website
                    </Link>
                    <Link href="https://aptosfoundation.org/" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Foundation
                    </Link>
                    <Link href="https://aptosfoundation.org/ecosystem/projects/all" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Ecosystem Projects
                    </Link>
                    <Link href="https://aptos.dev/" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Developer Docs
                    </Link>
                    <Link href="https://explorer.aptoslabs.com/?network=mainnet" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Explorer
                    </Link>
                    <Link href="https://github.com/aptos-labs" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      GitHub Profile
                    </Link>
                    <Link href="https://github.com/aptos-labs/aptos-core" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Source Code
                    </Link>
                    <Link href="https://aptosfoundation.org/currents" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Foundation Blog
                    </Link>
                    <Link href="https://aptoslabs.com/careers" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Open Roles
                    </Link>
                  </div>
                </Card>

                {/* Socials Column */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Socials
                  </h3>
                  <div className="space-y-3">
                    <Link href="https://discord.gg/aptosnetwork" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Discord
                    </Link>
                    <Link href="https://twitter.com/aptoslabs" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Labs Twitter
                    </Link>
                    <Link href="https://twitter.com/Aptos_Network" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Network Twitter
                    </Link>
                    <Link href="https://www.youtube.com/@aptosnetwork" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      YouTube
                    </Link>
                    <Link href="https://www.linkedin.com/company/aptoslabs" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      LinkedIn
                    </Link>
                    <Link href="https://forum.aptoslabs.com/" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Community Forum
                    </Link>
                    <Link href="https://medium.com/aptoslabs" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Medium
                    </Link>
                    <Link href="https://aptosfoundation.org/currents/join-the-aptos-collective" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Collective
                    </Link>
                  </div>
                </Card>

                {/* Communities Column */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Communities
                  </h3>
                  <div className="space-y-3">
                    <Link href="https://twitter.com/Aptos_polska" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Poland
                    </Link>
                    <Link href="https://twitter.com/aptos_ind" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos India
                    </Link>
                    <Link href="https://twitter.com/Aptos_Indonesia" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Indonesia
                    </Link>
                    <Link href="https://twitter.com/aptos_japan" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Japan
                    </Link>
                    <Link href="https://twitter.com/aptoscnofficial" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos China
                    </Link>
                    <Link href="https://twitter.com/aptosfrance" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos France
                    </Link>
                    <Link href="https://twitter.com/aptos_ru" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Russia
                    </Link>
                    <Link href="https://twitter.com/AptosTurkiye" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Turkey
                    </Link>
                    <Link href="https://twitter.com/Aptos_Africa" target="_blank" rel="noopener noreferrer" className="block text-sm text-foreground/70 hover:text-primary transition-colors">
                      Aptos Africa
                    </Link>
                  </div>
                </Card>
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