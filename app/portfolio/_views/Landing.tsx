"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Search,
  ArrowRight,
  Wallet,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface LandingProps {
  onManualAddressSubmit: (address: string) => void;
}

export function Landing({ onManualAddressSubmit }: LandingProps) {
  const { t } = useTranslation("common");
  const {} = useWallet();
  const [manualAddress, setManualAddress] = React.useState("");
  const [addressError, setAddressError] = React.useState("");

  const handleSubmit = () => {
    if (!manualAddress) {
      setAddressError(
        t("wallet.error_empty_address", "Please enter an address"),
      );
      return;
    }

    const cleanAddress = manualAddress.startsWith("0x")
      ? manualAddress
      : `0x${manualAddress}`;
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);

    if (!isValid) {
      setAddressError(
        t("wallet.error_invalid_format", "Invalid address format"),
      );
      return;
    }

    onManualAddressSubmit(cleanAddress);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Portfolio Tracker</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("portfolio.landing_title", "Track Your Aptos Portfolio")}
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {t(
              "portfolio.landing_subtitle",
              "Connect your wallet or enter an address to view comprehensive portfolio analytics",
            )}
          </p>
        </div>

        {/* Connection Options */}
        <div className="space-y-4">
          {/* Wallet Connection */}
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">
                    {t("wallet.connect_wallet", "Connect Wallet")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(
                      "wallet.connect_description",
                      "Connect your wallet for full portfolio features",
                    )}
                  </p>
                </div>
                <WalletConnectButton />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("common.or", "Or")}
              </span>
            </div>
          </div>

          {/* Manual Address Entry */}
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">
                    {t("wallet.view_any_address", "View Any Address")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(
                      "wallet.view_description",
                      "Enter any Aptos address to view its portfolio",
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      setAddressError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className={cn(
                      "font-mono text-sm",
                      addressError && "border-red-500",
                    )}
                  />
                  <Button onClick={handleSubmit} size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                {addressError && (
                  <p className="text-xs text-red-500">{addressError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h4 className="font-medium text-sm">
              {t("portfolio.feature_analytics", "Real-time Analytics")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t(
                "portfolio.feature_analytics_desc",
                "Track performance and trends",
              )}
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-lg bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <h4 className="font-medium text-sm">
              {t("portfolio.feature_secure", "Secure & Private")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("portfolio.feature_secure_desc", "Read-only access to data")}
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-lg bg-purple-500/10">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <h4 className="font-medium text-sm">
              {t("portfolio.feature_comprehensive", "Comprehensive View")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t(
                "portfolio.feature_comprehensive_desc",
                "Assets, NFTs, DeFi & more",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
