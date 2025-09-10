"use client";

import { GeistMono } from "geist/font/mono";
import { Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { AnsService } from "@/lib/services/blockchain/ans";
import { cn } from "@/lib/utils";

// Available logos from specified directories
const btcLogos = [
  { src: "/icons/btc/WBTC.webp", alt: "WBTC" },
  { src: "/icons/btc/bitcoin.webp", alt: "Bitcoin" },
  { src: "/icons/btc/echo.webp", alt: "Echo BTC" },
  { src: "/icons/btc/okx.webp", alt: "OKX BTC" },
  { src: "/icons/btc/stakestone.webp", alt: "StakeStone BTC" },
];

const stableLogos = [
  { src: "/icons/stables/USDA.webp", alt: "USDA" },
  { src: "/icons/stables/mod.webp", alt: "MOD" },
  { src: "/icons/stables/susde.webp", alt: "sUSDe" },
  { src: "/icons/stables/usdc.webp", alt: "USDC" },
  { src: "/icons/stables/usde.webp", alt: "USDe" },
  { src: "/icons/stables/usdt.webp", alt: "USDT" },
];

const protocolLogos = [
  { src: "/icons/protocols/agdex.webp", alt: "AGDEX" },
  { src: "/icons/protocols/amnis.avif", alt: "Amnis" },
  { src: "/icons/protocols/anqa.webp", alt: "ANQA" },
  { src: "/icons/protocols/aries.avif", alt: "Aries" },
  { src: "/icons/protocols/cellana.webp", alt: "Cellana" },
  { src: "/icons/protocols/echelon.avif", alt: "Echelon" },
  { src: "/icons/protocols/hyperion.webp", alt: "Hyperion" },
  { src: "/icons/protocols/ichi.jpg", alt: "ICHI" },
  { src: "/icons/protocols/joule.webp", alt: "Joule" },
  { src: "/icons/protocols/kana.webp", alt: "Kana" },
  { src: "/icons/protocols/kofi.avif", alt: "Kofi" },
  { src: "/icons/protocols/liquidswap.webp", alt: "Liquidswap" },
  { src: "/icons/protocols/merkle.webp", alt: "Merkle" },
  { src: "/icons/protocols/meso.webp", alt: "Meso" },
  { src: "/icons/protocols/moar.webp", alt: "MOAR" },
  { src: "/icons/protocols/pancake.webp", alt: "PancakeSwap" },
  { src: "/icons/protocols/panora.webp", alt: "Panora" },
  { src: "/icons/protocols/superposition.webp", alt: "Superposition" },
  { src: "/icons/protocols/sushi.webp", alt: "Sushi" },
  { src: "/icons/protocols/thala.avif", alt: "Thala" },
  { src: "/icons/protocols/thetis.webp", alt: "Thetis" },
  { src: "/icons/protocols/trufin.webp", alt: "Trufin" },
];

interface LandingSectionProps {
  onManualAddressSubmit?: (address: string) => void;
}

export const LandingSection = ({ onManualAddressSubmit }: LandingSectionProps) => {
  const [inputAddress, setInputAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const { t } = useTranslation("common");

  // Validate Aptos address format or ANS domain
  const validateInput = (input: string) => {
    if (!input) {
      setAddressError(t("wallet.error_empty_input", "Please enter an address or ANS name"));
      return false;
    }

    // Check if it's an ANS domain
    if (AnsService.isAptDomain(input)) {
      setAddressError("");
      return true;
    }

    // Otherwise validate as address
    const cleanAddress = input.startsWith("0x") ? input : `0x${input}`;

    // Aptos addresses are 64 hex characters (plus 0x prefix = 66 total)
    const isValidFormat = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);

    if (!isValidFormat) {
      setAddressError(t("wallet.error_invalid_format", "Invalid address format or ANS name"));
      return false;
    }

    setAddressError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput(inputAddress) || !onManualAddressSubmit) {
      return;
    }

    // Check if it's an ANS domain
    if (AnsService.isAptDomain(inputAddress)) {
      setIsResolving(true);
      setAddressError("");

      try {
        const result = await AnsService.resolveName(inputAddress);

        if (result.address) {
          onManualAddressSubmit(result.address);
        } else {
          setAddressError(
            `Could not resolve ${inputAddress}. The domain may not exist or has expired.`
          );
        }
      } catch {
        setAddressError("Failed to resolve ANS name");
      } finally {
        setIsResolving(false);
      }
    } else {
      // It's a regular address
      const cleanAddress = inputAddress.startsWith("0x") ? inputAddress : `0x${inputAddress}`;
      onManualAddressSubmit(cleanAddress);
    }
  };

  // Select a fixed set of logos to avoid hydration mismatch
  // Using a deterministic selection of logos from each category
  const orbitLogos = useMemo(() => {
    // Pick 2-3 from each category in a deterministic way with safe array access
    const selectedLogos = [
      btcLogos[0], // WBTC
      btcLogos[1], // Bitcoin
      stableLogos[4], // USDC
      stableLogos[6], // USDT
      stableLogos[5], // USDe
      protocolLogos[17], // Panora (correct index)
      protocolLogos[11], // Liquidswap (correct index)
      protocolLogos[20], // Thala (correct index)
    ].filter(Boolean); // Remove any undefined entries
    return selectedLogos;
  }, []);

  return (
    <div
      className={cn(
        "h-[calc(100vh-16rem)] flex flex-col relative overflow-hidden",
        GeistMono.className
      )}
    >
      <main className="flex-grow relative z-10 flex flex-col justify-center items-center py-1">
        <div className="container-layout w-full">
          {/* Mobile background logo */}
          <div className="absolute top-8 right-8 w-32 h-32 opacity-5 dark:opacity-10 md:hidden">
            <Image
              src="/icons/apt.png"
              alt=""
              width={128}
              height={128}
              className="object-contain dark:invert"
              aria-hidden="true"
            />
          </div>

          {/* Main content container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-center justify-center h-full pt-12">
            {/* Left Side - Big Text */}
            <div className="space-y-3 text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Track your
                <br />
                <span className="text-primary">Aptos</span> portfolio
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-full md:max-w-lg">
                Track tokens, DeFi positions, and NFTs
              </p>

              {/* CTA Section with Wallet Connect and Address Input */}
              <div className="space-y-2 pt-1">
                <div className="space-y-2 max-w-xs">
                  <WalletConnectButton size="lg" className="h-10 px-6 text-sm w-full" />

                  <div className="flex items-center gap-3">
                    <div className="h-[1px] bg-border flex-1" />
                    <span className="text-sm text-muted-foreground">{t("common.or", "or")}</span>
                    <div className="h-[1px] bg-border flex-1" />
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder={t("wallet.search_ans_placeholder", "Search any wallet or ANS")}
                      value={inputAddress}
                      onChange={(e) => {
                        setInputAddress(e.target.value);
                        setAddressError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && inputAddress && !isResolving) {
                          handleSubmit();
                        }
                      }}
                      disabled={isResolving}
                      className={cn(
                        "pl-11 h-10 text-sm transition-all w-full",
                        addressError && "border-destructive focus-visible:ring-destructive/50",
                        isResolving && "opacity-50 cursor-wait"
                      )}
                    />
                    {addressError && (
                      <p className="text-sm text-destructive mt-1">{addressError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Logo with Saturn Ring */}
            <div className="relative hidden md:flex items-center justify-center order-first md:order-last">
              {/* Saturn Ring Container */}
              <div className="relative w-full max-w-xs lg:max-w-sm xl:max-w-md">
                <div className="aspect-square relative">
                  {/* Central APT Logo */}
                  <div className="absolute inset-[25%] z-10">
                    <Image
                      src="/icons/apt.png"
                      alt="Aptos"
                      fill
                      className="object-contain opacity-20 dark:opacity-30 dark:invert"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = "/placeholder.jpg";
                      }}
                    />
                  </div>

                  {/* Outer Ring - Orbiting Logos */}
                  <div className="absolute inset-0 animate-spin-slow">
                    {orbitLogos.map((logo, index) => {
                      // Position logos evenly around the circle
                      const angle = (index / 8) * 2 * Math.PI;
                      const radius = 50; // percentage from center

                      // Calculate position
                      const x = 50 + radius * Math.cos(angle);
                      const y = 50 + radius * Math.sin(angle);

                      // Determine size based on position (larger at cardinal points)
                      const isCardinal = index % 2 === 0;
                      const sizeClasses = isCardinal
                        ? "w-8 h-8 lg:w-10 lg:h-10"
                        : "w-6 h-6 lg:w-8 lg:h-8";

                      return (
                        <div
                          key={index}
                          className={`absolute ${sizeClasses} rounded-full overflow-hidden bg-white dark:bg-neutral-800`}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional: Static ring effect */}
                  <div className="absolute inset-0 rounded-full border border-primary/10 dark:border-primary/20"></div>
                  <div className="absolute inset-[10%] rounded-full border border-primary/5 dark:border-primary/10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
