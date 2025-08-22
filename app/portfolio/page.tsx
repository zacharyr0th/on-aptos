"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useState } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useTranslation } from "@/hooks/useTranslation";

// New consolidated imports
import { LandingSection } from "./_components/shared/LandingSection";
import {
  AccessibilityProvider,
  SkipLinks,
  useAriaAnnouncer,
} from "./_guards/AccessibilityEnhancements";
import {
  OfflineStateHandler,
  DataConsistencyChecker,
  BrowserCompatibilityGuard,
} from "./_guards/ProductionValidators";
import { PageErrorBoundary } from "./_guards/RobustErrorBoundary";
import { PortfolioProviders, usePortfolioContext } from "./_providers";
import { Dashboard } from "./_views/Dashboard";
import { Loading } from "./_views/Loading";

// Production-ready components

export default function PortfolioPage() {
  return (
    <BrowserCompatibilityGuard>
      <AccessibilityProvider>
        <PageErrorBoundary>
          <div className="min-h-screen relative">
            {/* Background gradient - fixed to viewport */}
            <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10">
              <SkipLinks />
              <OfflineStateHandler>
                <PortfolioPageContent />
              </OfflineStateHandler>
            </div>
          </div>
        </PageErrorBoundary>
      </AccessibilityProvider>
    </BrowserCompatibilityGuard>
  );
}

function PortfolioPageContent() {
  const { connected, account } = useWallet();
  const { t } = useTranslation("common");
  const { announce, AriaLiveRegion } = useAriaAnnouncer();

  // State for manual address entry
  const [manualAddress, setManualAddress] = useState<string>("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [addressError, setAddressError] = useState<string>("");
  const [selectedTimeframe] = useState<
    "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all"
  >("1y");

  // Get wallet address
  const walletAddress = account?.address?.toString();
  const activeAddress = isManualMode ? manualAddress : walletAddress;
  const normalizedAddress =
    activeAddress && !activeAddress.startsWith("0x")
      ? `0x${activeAddress}`
      : activeAddress;

  // Validate Aptos address
  const validateAddress = (address: string) => {
    if (!address) {
      const errorMsg = t(
        "wallet.error_empty_address",
        "Please enter an address",
      );
      setAddressError(errorMsg);
      announce(errorMsg);
      return false;
    }

    const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);

    if (!isValid) {
      const errorMsg = t(
        "wallet.error_invalid_format",
        "Invalid address format",
      );
      setAddressError(errorMsg);
      announce(errorMsg);
      return false;
    }

    setAddressError("");
    announce("Valid address entered");
    return true;
  };

  const handleAddressSubmit = () => {
    if (validateAddress(manualAddress)) {
      setIsManualMode(true);
      announce("Portfolio loaded for manual address");
    }
  };

  const clearManualMode = () => {
    setIsManualMode(false);
    setManualAddress("");
    setAddressError("");
    announce("Switched back to connected wallet");
  };

  // Show landing if no address (full width header)
  if (!normalizedAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <AriaLiveRegion />
        <main id="main-content" className="flex-1">
          <LandingSection
            onManualAddressSubmit={(address) => {
              setManualAddress(address);
              if (validateAddress(address)) {
                setIsManualMode(true);
              }
            }}
          />
        </main>
      </div>
    );
  }

  // Show portfolio with header (when address is available)
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AriaLiveRegion />
      <main id="main-content" className="flex-1">
        <PortfolioProviders
          address={normalizedAddress}
          timeframe={selectedTimeframe}
        >
          <DataConsistencyChecker
            data={{ address: normalizedAddress }}
            onValidationError={(errors) => {
              logger.error("Portfolio data validation errors");
              announce(`Data validation error: ${errors[0]}`);
            }}
          >
            <PortfolioContent
              address={normalizedAddress}
              isManualMode={isManualMode}
              manualAddress={manualAddress}
              addressError={addressError}
              connected={connected}
              onManualAddressChange={(address) => {
                setManualAddress(address);
                setAddressError("");
              }}
              onManualAddressSubmit={handleAddressSubmit}
              onClearManualMode={clearManualMode}
            />
          </DataConsistencyChecker>
        </PortfolioProviders>
      </main>
      <Footer className="border-t border-border/50" />
    </div>
  );
}

function PortfolioContent({
  address: _address,
  isManualMode,
  manualAddress,
  addressError,
  connected,
  onManualAddressChange,
  onManualAddressSubmit,
  onClearManualMode,
}: {
  address: string;
  isManualMode: boolean;
  manualAddress: string;
  addressError: string;
  connected: boolean;
  onManualAddressChange: (address: string) => void;
  onManualAddressSubmit: () => void;
  onClearManualMode: () => void;
}) {
  const { isLoading, historyLoading } = usePortfolioContext();

  if (isLoading || historyLoading) {
    return <Loading />;
  }

  return (
    <Dashboard
      isManualMode={isManualMode}
      manualAddress={manualAddress}
      addressError={addressError}
      connected={connected}
      onManualAddressChange={onManualAddressChange}
      onManualAddressSubmit={onManualAddressSubmit}
      onClearManualMode={onClearManualMode}
    />
  );
}
