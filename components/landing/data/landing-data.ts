import type { LucideIcon } from "lucide-react";
import {
  Code,
  Eye,
  Info,
  Key,
  Layers,
  Search,
  Settings,
  Shield,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Process 100k+ transactions per second with sub-second finality — 6,000x faster than Ethereum",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Move prevents common vulnerabilities that plague Solidity chains",
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "Ship in days with Move, comprehensive SDKs, and extensive documentation",
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

export const wallets = [
  {
    name: "Petra",
    description: "The most popular Aptos wallet",
    href: "https://petra.app/",
    logo: "/icons/petra.webp",
  },
  {
    name: "Backpack",
    description: "Multi-chain wallet with Aptos support",
    href: "https://chromewebstore.google.com/detail/backpack/aflkmfhebedbjioipglgcbcmnbpgliof",
    logo: "/icons/cex/backpack.jpg",
  },
  {
    name: "Aptos Connect",
    description: "Login with Apple or Google",
    href: "https://aptosconnect.app/",
    logo: "/icons/apt.png",
  },
];

const allBridges = [
  {
    name: "Stargate (LayerZero)",
    description:
      "Seamless transfers of LayerZero-wrapped stablecoins and Omnichain Fungible Tokens (OFT assets)",
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
    description:
      "Cross-chain bridge with CCTP integration for native USDC, accessible via Stargate",
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
    description:
      "Integrated with Stargate, quickly 'refuels' Aptos wallets with APT tokens for covering gas fees",
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
    description:
      "Complete guide to bridging assets onto Aptos with detailed instructions and best practices",
    href: "https://x.com/zacharyr0th/status/1915031084976451596",
    logo: "/icons/apt.png",
    bridgeTime: "N/A",
    fees: "N/A",
    networks: "Guide",
    protocol: "EDUCATIONAL",
    status: "Guide",
  },
];

// Pre-filtered static exports for performance
export const bridges = allBridges;
export const liveBridges = allBridges.filter((b) => b.status === "Live");
export const bridgeGuides = allBridges.filter((b) => b.status === "Guide");

type Region = "US" | "KR" | "Global";

interface Exchange {
  region: Region;
  name: string;
  chain: string;
  usdt: "Y" | "N" | "";
  usdc: "Y" | "N" | "";
  link: string;
  logo?: string;
}

export const exchanges: Exchange[] = [
  // Coinbase (US)
  {
    region: "US",
    name: "Coinbase",
    chain: "Aptos",
    usdt: "N",
    usdc: "Y",
    link: "https://www.coinbase.com",
    logo: "/icons/cex/coinbase.web.png",
  },
  {
    region: "US",
    name: "Coinbase",
    chain: "Solana",
    usdt: "N",
    usdc: "Y",
    link: "https://www.coinbase.com",
  },
  {
    region: "US",
    name: "Coinbase",
    chain: "ETH",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.coinbase.com",
  },
  {
    region: "US",
    name: "Coinbase",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.coinbase.com",
  },

  // Upbit (KR)
  {
    region: "KR",
    name: "Upbit",
    chain: "Aptos",
    usdt: "Y",
    usdc: "N",
    link: "https://upbit.com",
    logo: "/icons/cex/upbit.jpg",
  },
  { region: "KR", name: "Upbit", chain: "Solana", usdt: "N", usdc: "Y", link: "https://upbit.com" },
  { region: "KR", name: "Upbit", chain: "Tron", usdt: "Y", usdc: "N", link: "https://upbit.com" },
  { region: "KR", name: "Upbit", chain: "Base", usdt: "N", usdc: "N", link: "https://upbit.com" },

  // Bithumb (KR)
  {
    region: "KR",
    name: "Bithumb",
    chain: "Solana",
    usdt: "",
    usdc: "",
    link: "https://www.bithumb.com",
  },

  // Binance (Global)
  {
    region: "Global",
    name: "Binance",
    chain: "Aptos",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.binance.com",
    logo: "/icons/cex/binance.webp",
  },
  {
    region: "Global",
    name: "Binance",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.binance.com",
  },
  {
    region: "Global",
    name: "Binance",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.binance.com",
  },
  {
    region: "Global",
    name: "Binance",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.binance.com",
  },

  // Bybit (Global)
  {
    region: "Global",
    name: "Bybit",
    chain: "Aptos",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.bybit.com",
    logo: "/icons/cex/bybit.jpg",
  },
  {
    region: "Global",
    name: "Bybit",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.bybit.com",
  },
  {
    region: "Global",
    name: "Bybit",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.bybit.com",
  },
  {
    region: "Global",
    name: "Bybit",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.bybit.com",
  },

  // OKX (Global)
  {
    region: "Global",
    name: "OKX",
    chain: "Aptos",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.okx.com",
    logo: "/icons/cex/okx.jpg",
  },
  {
    region: "Global",
    name: "OKX",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.okx.com",
  },
  {
    region: "Global",
    name: "OKX",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.okx.com",
  },
  {
    region: "Global",
    name: "OKX",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.okx.com",
  },

  // Bitget (Global)
  {
    region: "Global",
    name: "Bitget",
    chain: "Aptos",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.bitget.com",
    logo: "/icons/cex/bitget.jpg",
  },
  {
    region: "Global",
    name: "Bitget",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.bitget.com",
  },
  {
    region: "Global",
    name: "Bitget",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.bitget.com",
  },
  {
    region: "Global",
    name: "Bitget",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.bitget.com",
  },

  // MEXC (Global)
  {
    region: "Global",
    name: "MEXC",
    chain: "Aptos",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.mexc.com",
    logo: "/icons/cex/mexc.webp",
  },
  {
    region: "Global",
    name: "MEXC",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.mexc.com",
  },
  {
    region: "Global",
    name: "MEXC",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.mexc.com",
  },
  {
    region: "Global",
    name: "MEXC",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.mexc.com",
  },

  // Bitfinex (Global)
  {
    region: "Global",
    name: "Bitfinex",
    chain: "Aptos",
    usdt: "Y",
    usdc: "N",
    link: "https://www.bitfinex.com",
    logo: "/icons/cex/bitfinex.webp",
  },
  {
    region: "Global",
    name: "Bitfinex",
    chain: "Solana",
    usdt: "Y",
    usdc: "N",
    link: "https://www.bitfinex.com",
  },
  {
    region: "Global",
    name: "Bitfinex",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.bitfinex.com",
  },

  // KuCoin (Global)
  {
    region: "Global",
    name: "KuCoin",
    chain: "Aptos",
    usdt: "Y",
    usdc: "N",
    link: "https://www.kucoin.com",
    logo: "/icons/cex/kucoin.jpg",
  },
  {
    region: "Global",
    name: "KuCoin",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.kucoin.com",
  },
  {
    region: "Global",
    name: "KuCoin",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.kucoin.com",
  },

  // Backpack (Global)
  {
    region: "Global",
    name: "Backpack",
    chain: "Aptos",
    usdt: "N",
    usdc: "Y",
    link: "https://backpack.exchange",
    logo: "/icons/cex/backpack.jpg",
  },
  {
    region: "Global",
    name: "Backpack",
    chain: "Solana",
    usdt: "N",
    usdc: "Y",
    link: "https://backpack.exchange",
  },
  {
    region: "Global",
    name: "Backpack",
    chain: "Tron",
    usdt: "N",
    usdc: "N",
    link: "https://backpack.exchange",
  },

  // Flipster (KR)
  {
    region: "KR",
    name: "Flipster",
    chain: "Aptos",
    usdt: "Y",
    usdc: "N",
    link: "https://flipster.io",
    logo: "/icons/cex/flipster.jpg",
  },
  {
    region: "KR",
    name: "Flipster",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://flipster.io",
  },
  {
    region: "KR",
    name: "Flipster",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://flipster.io",
  },
  {
    region: "KR",
    name: "Flipster",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://flipster.io",
  },

  // Gate.io
  {
    region: "Global",
    name: "Gate.io",
    chain: "Aptos",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.gate.io",
    logo: "/icons/cex/gate.jpg",
  },
  {
    region: "Global",
    name: "Gate.io",
    chain: "Solana",
    usdt: "Y",
    usdc: "Y",
    link: "https://www.gate.io",
  },
  {
    region: "Global",
    name: "Gate.io",
    chain: "Tron",
    usdt: "Y",
    usdc: "N",
    link: "https://www.gate.io",
  },
  {
    region: "Global",
    name: "Gate.io",
    chain: "Base",
    usdt: "N",
    usdc: "Y",
    link: "https://www.gate.io",
  },
];

// Pre-filtered exchanges for performance
export const aptosExchanges = exchanges.filter((ex) => ex.chain === "Aptos");

export const developerTools = [
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
    name: "Geomi (Developer Portal)",
    description: "API keys, Transaction Stream, and Indexer API access",
    href: "https://geomi.dev/",
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

export const developerResources = [
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

export const navigationSections = [
  { id: "overview", label: "Overview" },
  { id: "why-aptos", label: "Why Aptos" },
  { id: "getting-started", label: "Get Started" },
  { id: "defi", label: "DeFi" },
  { id: "tokens", label: "Markets" },
  { id: "developers", label: "Developers" },
  { id: "community", label: "Community" },
];
