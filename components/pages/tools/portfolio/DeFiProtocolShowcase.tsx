/**
 * DeFi Protocol Showcase Component
 * Displays all supported DeFi protocols with their logos in a compact grid
 */

import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";

interface Protocol {
  id: string;
  name: string;
  logo: string;
  type: string;
  website?: string;
}

const SUPPORTED_PROTOCOLS: Protocol[] = [
  // DEX Protocols
  {
    id: "thala",
    name: "Thala",
    logo: "/icons/protocols/thala.avif",
    type: "DEX",
    website: "https://thala.fi",
  },
  {
    id: "liquidswap",
    name: "LiquidSwap",
    logo: "/icons/protocols/liquidswap.webp",
    type: "DEX",
    website: "https://liquidswap.com",
  },
  {
    id: "pancakeswap",
    name: "PancakeSwap",
    logo: "/icons/protocols/pancake.webp",
    type: "DEX",
    website: "https://aptos.pancakeswap.finance",
  },
  {
    id: "sushiswap",
    name: "SushiSwap",
    logo: "/icons/protocols/sushi.webp",
    type: "DEX",
    website: "https://sushi.com",
  },
  {
    id: "cellana",
    name: "Cellana",
    logo: "/icons/protocols/cellana.webp",
    type: "DEX",
    website: "https://cellana.finance",
  },
  {
    id: "panora",
    name: "Panora",
    logo: "/icons/protocols/panora.webp",
    type: "DEX",
    website: "https://panora.exchange",
  },
  {
    id: "kana",
    name: "Kana Labs",
    logo: "/icons/protocols/kana.webp",
    type: "DEX Aggregator",
    website: "https://kanalabs.io",
  },
  {
    id: "hyperion",
    name: "Hyperion",
    logo: "/icons/protocols/hyperion.webp",
    type: "DEX",
    website: "https://hyperion.markets",
  },

  // Lending Protocols
  {
    id: "aries",
    name: "Aries Markets",
    logo: "/icons/protocols/aries.avif",
    type: "Lending",
    website: "https://ariesmarkets.xyz",
  },
  {
    id: "echo",
    name: "Echo Lending",
    logo: "/icons/protocols/echo.webp",
    type: "Lending",
    website: "https://echo.xyz",
  },
  {
    id: "meso",
    name: "Meso Finance",
    logo: "/icons/protocols/meso.webp",
    type: "Lending",
    website: "https://meso.finance",
  },
  {
    id: "joule",
    name: "Joule Finance",
    logo: "/icons/protocols/joule.webp",
    type: "Lending",
    website: "https://joule.finance",
  },
  {
    id: "superposition",
    name: "Superposition",
    logo: "/icons/protocols/superposition.webp",
    type: "Lending",
    website: "https://superposition.finance",
  },
  {
    id: "thetis",
    name: "Thetis Market",
    logo: "/icons/protocols/thetis.webp",
    type: "Lending",
    website: "https://thetis.market",
  },

  // Liquid Staking Protocols
  {
    id: "amnis",
    name: "Amnis Finance",
    logo: "/icons/protocols/amnis.avif",
    type: "Liquid Staking",
    website: "https://amnis.finance",
  },
  {
    id: "thala-lsd",
    name: "Thala LSD",
    logo: "/icons/protocols/thala.avif",
    type: "Liquid Staking",
    website: "https://thala.fi",
  },
  {
    id: "trufin",
    name: "Trufin",
    logo: "/icons/protocols/trufin.webp",
    type: "Liquid Staking",
    website: "https://trufin.io",
  },

  // Derivatives & Perps
  {
    id: "merkle",
    name: "Merkle Trade",
    logo: "/icons/protocols/merkle.webp",
    type: "Derivatives",
    website: "https://merkle.trade",
  },

  // Other DeFi

  // Bridges
  {
    id: "wormhole",
    name: "Wormhole",
    logo: "/icons/protocols/wormhole.webp",
    type: "Bridge",
    website: "https://wormhole.com",
  },
  {
    id: "celer",
    name: "Celer",
    logo: "/icons/protocols/celer.webp",
    type: "Bridge",
    website: "https://cbridge.celer.network",
  },
  {
    id: "layerzero",
    name: "LayerZero",
    logo: "/icons/protocols/lz.webp",
    type: "Bridge",
    website: "https://layerzero.network",
  },
];

interface ProtocolCategoryProps {
  title: string;
  protocols: Protocol[];
  color: string;
}

const ProtocolCategory: React.FC<ProtocolCategoryProps> = ({ title, protocols, color }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className={cn("w-0.5 h-4 rounded-full", color)} />
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <span className="text-xs text-muted-foreground/60">({protocols.length})</span>
    </div>
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
      {protocols.map((protocol) => (
        <div key={protocol.id} className="group relative">
          <button
            onClick={() => protocol.website && window.open(protocol.website, "_blank")}
            className="w-full aspect-square rounded-lg border border-border/40 bg-background/60 p-2 hover:bg-card hover:border-primary/50 hover:scale-105 hover:shadow-lg transition-all duration-200"
            aria-label={protocol.name}
          >
            <div className="relative w-full h-full">
              <Image
                src={protocol.logo}
                alt={protocol.name}
                fill
                className="object-contain"
                sizes="60px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.jpg";
                }}
              />
            </div>
          </button>
          {/* Tooltip on hover - positioned above to avoid overflow */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 px-2 py-1 bg-popover/95 backdrop-blur-sm text-popover-foreground text-xs rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-border/50">
            {protocol.name}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DeFiProtocolShowcase: React.FC = () => {
  // Group protocols by category
  const dexProtocols = SUPPORTED_PROTOCOLS.filter(
    (p) => p.type === "DEX" || p.type === "DEX Aggregator" || p.type === "Order Book DEX"
  );
  const lendingProtocols = SUPPORTED_PROTOCOLS.filter((p) => p.type === "Lending");
  const stakingProtocols = SUPPORTED_PROTOCOLS.filter((p) => p.type === "Liquid Staking");
  const derivativesProtocols = SUPPORTED_PROTOCOLS.filter((p) => p.type === "Derivatives");
  const bridgeProtocols = SUPPORTED_PROTOCOLS.filter((p) => p.type === "Bridge");
  const otherProtocols = SUPPORTED_PROTOCOLS.filter(
    (p) =>
      ![
        "DEX",
        "DEX Aggregator",
        "Order Book DEX",
        "Lending",
        "Liquid Staking",
        "Derivatives",
        "Bridge",
      ].includes(p.type)
  );

  return (
    <div className="w-full space-y-4 p-3">
      {/* Compact Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground">DeFi Protocol Coverage</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-muted-foreground">Live</span>
          </span>
        </div>
      </div>

      {/* Compact Protocol Grid */}
      <div className="space-y-4">
        {dexProtocols.length > 0 && (
          <ProtocolCategory title="DEX & AMMs" protocols={dexProtocols} color="bg-blue-500" />
        )}

        {lendingProtocols.length > 0 && (
          <ProtocolCategory title="Lending" protocols={lendingProtocols} color="bg-green-500" />
        )}

        {stakingProtocols.length > 0 && (
          <ProtocolCategory title="Staking" protocols={stakingProtocols} color="bg-purple-500" />
        )}

        {derivativesProtocols.length > 0 && (
          <ProtocolCategory
            title="Derivatives"
            protocols={derivativesProtocols}
            color="bg-orange-500"
          />
        )}

        {bridgeProtocols.length > 0 && (
          <ProtocolCategory title="Bridges" protocols={bridgeProtocols} color="bg-cyan-500" />
        )}

        {otherProtocols.length > 0 && (
          <ProtocolCategory title="Other" protocols={otherProtocols} color="bg-pink-500" />
        )}
      </div>

      {/* Compact Footer */}
      <div className="pt-3 border-t border-border/30">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <a
            href="https://github.com/yourusername/on-aptos"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>Request protocol</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
};
