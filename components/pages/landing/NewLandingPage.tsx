"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import { GeistMono } from "geist/font/mono";
import {
  Search,
  DollarSign,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  Github,
  CheckCircle2,
  Bitcoin,
  Building2,
  Coins,
  ArrowUpRight,
  PlayCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  Code,
  Layers,
  Activity,
  Database,
  Link2,
  ExternalLink,
  Sparkles,
  Timer,
  Target,
  Award,
  Wallet,
  LineChart,
  PieChart,
  TrendingDown,
  RefreshCw,
  Lock,
  Unlock,
  CreditCard,
  DollarSign as Dollar,
  Percent,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Hash,
  Terminal,
  Cpu,
  Cloud,
  Server,
  GitBranch,
  Package,
  Puzzle,
  Briefcase,
  HeartHandshake,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback, useRef } from "react";

import { defiProtocols } from "@/components/pages/defi/data/protocols";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { GitHubStarCount } from "@/components/ui/github-star-count";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useTranslation } from "@/hooks/useTranslation";
import { DEVELOPER_CONFIG } from "@/lib/config/app";
import { cn } from "@/lib/utils";

// Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 2000,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const end = value;
    const increment = end / (duration / 50);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Removed FloatingLogos component - no longer needed

// Sophisticated Metric Card Component
const MetricCard = ({
  label,
  value,
  prefix = "",
  suffix = "",
  description,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  description?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      <div className="p-4 sm:p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/40 transition-colors">
        <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
          {label}
        </div>
        <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
          {prefix}
          <AnimatedCounter value={value} />
          {suffix}
        </div>
        {description && (
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Removed ActivityFeed component - no longer needed

// Clean Feature Card Component
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="group"
    >
      <Card className="p-4 sm:p-6 h-full border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/40 transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
        </div>
        <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </Card>
    </motion.div>
  );
};

// Sophisticated Analytics Component
const AnalyticsVisualization = () => {
  const [currentMetricSet, setCurrentMetricSet] = useState(0);

  const metricSets = [
    [
      {
        label: "USDT Supply on Aptos",
        value: 125,
        prefix: "$",
        suffix: "M",
        trend: "Growing",
      },
      { label: "NFTs in Wallet", value: 47, suffix: "", trend: "Tracked" },
      { label: "DeFi Positions", value: 8, suffix: "", trend: "Active" },
    ],
    [
      { label: "Yield Opportunities", value: 15, suffix: "%", trend: "APY" },
      { label: "Portfolio Diversity", value: 23, suffix: "", trend: "Assets" },
      {
        label: "Staking Rewards",
        value: 156,
        prefix: "",
        suffix: " APT",
        trend: "Earned",
      },
    ],
    [
      {
        label: "LP Token Value",
        value: 8420,
        prefix: "$",
        suffix: "",
        trend: "+12.4%",
      },
      {
        label: "Collection Floor",
        value: 2.8,
        suffix: " APT",
        trend: "Rising",
      },
      {
        label: "Transactions",
        value: 1247,
        prefix: "",
        suffix: "",
        trend: "Total",
      },
    ],
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetricSet((prev) => (prev + 1) % metricSets.length);
    }, 6000); // Change every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const currentMetrics = metricSets[currentMetricSet];

  return (
    <div className="space-y-4 sm:space-y-6">
      <AnimatePresence mode="wait">
        {currentMetrics.map((metric, index) => (
          <motion.div
            key={`${currentMetricSet}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">
                {metric.label}
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">
                {metric.prefix}
                {metric.value.toLocaleString()}
                {metric.suffix}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-green-500 font-medium ml-2">
              {metric.trend}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const NewLandingPage = () => {
  const [mounted, setMounted] = useState(false);
  const [showAllProtocols, setShowAllProtocols] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [currentShowcase, setCurrentShowcase] = useState(0);
  const [activeTab, setActiveTab] = useState("portfolio");
  const { theme } = useTheme();
  const { t } = useTranslation("common");

  // Scroll animations
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on("select", onSelect);
    onSelect();
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShowcase((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary/70 rounded-full animate-pulse [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-screen relative textured-bg", GeistMono.className)}
    >
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary/60 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Hero Section - Clean and Sophisticated */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-4xl text-center">
            {/* Announcement Badge - Refined */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">
                  Live on Aptos Mainnet
                </span>
              </div>
            </motion.div>

            {/* Main Headline - Premium Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 sm:mb-8 leading-[1.1] sm:leading-[0.9]"
            >
              <span className="block text-foreground">Your complete</span>
              <span className="block text-foreground">Aptos portfolio</span>
              <span className="block text-foreground/60">in one place.</span>
            </motion.h1>

            {/* Subheading - Clean and Refined */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-lg mx-auto leading-relaxed px-2 sm:px-0"
            >
              Track your NFT collections, tokens, and transaction history with
              real-time analytics and insights.
            </motion.p>

            {/* CTA Buttons - Sophisticated */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4 sm:px-0"
            >
              <Link href="/portfolio" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base font-medium bg-foreground text-background hover:bg-foreground/90 touch-manipulation"
                >
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base border-border/50 hover:bg-card/50 touch-manipulation"
                >
                  View Demo
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators - Minimal */}
          </div>
        </div>

        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                    Track everything
                    <br />
                    that counts
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                    From DeFi yields to NFT valuations, get complete visibility
                    into your Aptos ecosystem investments with real-time
                    analytics.
                  </p>
                  <Link href="/portfolio">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base border-border/50 hover:bg-card/50 touch-manipulation"
                    >
                      Explore Analytics
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <div>
                <AnalyticsVisualization />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Partners Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Connect with your favorite protocols
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                View all your assets and transactions in one unified dashboard.
              </p>
            </div>

            {/* Protocol Grid - Mobile Optimized */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {[
                { name: "Thala", logo: "/icons/protocols/thala.avif" },
                { name: "Amnis", logo: "/icons/protocols/amnis.avif" },
                { name: "PancakeSwap", logo: "/icons/protocols/pancake.webp" },
                {
                  name: "Liquidswap",
                  logo: "/icons/protocols/liquidswap.webp",
                },
                { name: "Aries", logo: "/icons/protocols/aries.avif" },
                { name: "Cellana", logo: "/icons/protocols/cellana.webp" },
                { name: "Panora", logo: "/icons/protocols/panora.webp" },
                { name: "Sushi", logo: "/icons/protocols/sushi.webp" },
                { name: "VibrantX", logo: "/icons/protocols/vibrantx.webp" },
                { name: "Echelon", logo: "/icons/protocols/echelon.avif" },
                { name: "Kana", logo: "/icons/protocols/kana.webp" },
                { name: "Thetis", logo: "/icons/protocols/thetis.webp" },
              ].map((protocol, index) => (
                <motion.div
                  key={protocol.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="p-2 sm:p-3 md:p-4 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/40 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer touch-manipulation">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg overflow-hidden">
                        <Image
                          src={protocol.logo}
                          alt={protocol.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-center line-clamp-1">
                        {protocol.name}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12">
              <Link href="/defi">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 touch-manipulation text-sm sm:text-base"
                >
                  <span className="block sm:hidden">View All Protocols</span>
                  <span className="hidden sm:block">
                    View All Aptos DeFi Protocols
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm mb-6 sm:mb-8">
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">Open Source</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
                100% Open Source
              </h2>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
                MIT licensed. Fork it, customize it, make it yours. No vendor
                lock-in, no hidden fees, no compromises.
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="p-4 sm:p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm"
                >
                  <Code className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4 mx-auto" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">
                    Transparent Code
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Every API call, every calculation, every line - fully
                    auditable on GitHub.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="p-4 sm:p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm"
                >
                  <HeartHandshake className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4 mx-auto" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">
                    True Public Good
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Not VC-backed. No token. Just a tool built for the
                    community's benefit.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="p-4 sm:p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm"
                >
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4 mx-auto" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">
                    Read-Only Safety
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Never asks for private keys. View-only access keeps your
                    assets secure.
                  </p>
                </motion.div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <a
                  href={DEVELOPER_CONFIG.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base border-border/50 hover:bg-card/50 touch-manipulation"
                  >
                    <Github className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    View on GitHub
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base touch-manipulation"
                >
                  Contribute
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's on Aptos Section */}
      <section id="dashboards" className="py-16 sm:py-24 lg:py-32 relative">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                What's on Aptos?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                Comprehensive dashboards and analytics for everything happening
                on Aptos
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  title: "Portfolio Tracker",
                  description:
                    "Complete wallet overview with DeFi positions, NFTs, and transaction history",
                  icon: Wallet,
                  href: "/portfolio",
                  features: [
                    "Real-time balances",
                    "Transaction analysis",
                    "Performance metrics",
                  ],
                },
                {
                  title: "DeFi Dashboard",
                  description:
                    "Track yields, liquidity pools, and lending positions across 23+ protocols",
                  icon: TrendingUp,
                  href: "/defi",
                  features: [
                    "Yield opportunities",
                    "Protocol metrics",
                    "APY tracking",
                  ],
                },
                {
                  title: "Token Analytics",
                  description:
                    "Comprehensive token data, price charts, and market analysis",
                  icon: Coins,
                  href: "/tokens",
                  features: ["Price tracking", "Supply analysis"],
                },
                {
                  title: "Bitcoin on Aptos",
                  description:
                    "Track Bitcoin-wrapped assets, yields, and opportunities on Aptos",
                  icon: Bitcoin,
                  href: "/bitcoin",
                  features: ["BTC assets", "Yield tracking", "Supply data"],
                },
                {
                  title: "Stablecoins",
                  description:
                    "Monitor stablecoin supplies, yields, and ecosystem health",
                  icon: DollarSign,
                  href: "/stables",
                  features: [
                    "Supply tracking",
                    "Yield opportunities",
                    "Usage analytics",
                  ],
                },
                {
                  title: "Real World Assets",
                  description:
                    "Track RWA tokens, yields, and traditional assets on Aptos",
                  icon: Building2,
                  href: "/rwas",
                  features: [
                    "RWA tracking",
                    "Traditional assets",
                    "Yield analysis",
                  ],
                },
              ].map((dashboard, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={dashboard.href}>
                    <Card className="h-full p-4 sm:p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/40 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group touch-manipulation">
                      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <dashboard.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                            {dashboard.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                            {dashboard.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12">
              <Link href="/portfolio">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 touch-manipulation text-sm sm:text-base"
                >
                  <span className="block sm:hidden">View Portfolio</span>
                  <span className="hidden sm:block">
                    View Your Portfolio Dashboard
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
                Supercharge your
                <br />
                portfolio tracking
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-4 sm:px-0">
                Built for the Aptos community to track and analyze their digital
                assets.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4 sm:px-0">
                <Link href="/portfolio" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base touch-manipulation"
                  >
                    Start Tracking Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#dashboards" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base touch-manipulation"
                  >
                    View Analytics
                    <PlayCircle className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
      </section>

      {/* Footer Controls */}
    </div>
  );
};

export default NewLandingPage;
