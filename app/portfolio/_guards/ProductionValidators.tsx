"use client";

import { AlertTriangle, Wifi, WifiOff, Clock } from "lucide-react";
import React, { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ============ Network State Management ============

interface NetworkState {
  isOnline: boolean;
  isSlowConnection: boolean;
  lastOnline: Date | null;
}

export function useNetworkState(): NetworkState & {
  retryConnection: () => void;
} {
  const [networkState, setNetworkState] = React.useState<NetworkState>({
    isOnline: typeof window !== "undefined" ? navigator.onLine : true,
    isSlowConnection: false,
    lastOnline: new Date(),
  });

  const checkConnectionSpeed = React.useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const startTime = Date.now();
      await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      });
      const duration = Date.now() - startTime;

      // Consider connection slow if health check takes > 2 seconds
      setNetworkState((prev) => ({
        ...prev,
        isSlowConnection: duration > 2000,
        lastOnline: new Date(),
      }));
    } catch {
      setNetworkState((prev) => ({
        ...prev,
        isSlowConnection: true,
      }));
    }
  }, []);

  const retryConnection = React.useCallback(() => {
    checkConnectionSpeed();
  }, [checkConnectionSpeed]);

  React.useEffect(() => {
    const handleOnline = () => {
      setNetworkState((prev) => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
      }));
      checkConnectionSpeed();
    };

    const handleOffline = () => {
      setNetworkState((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connection speed check
    checkConnectionSpeed();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnectionSpeed]);

  return { ...networkState, retryConnection };
}

// ============ Offline State Handler ============

interface OfflineStateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function OfflineStateHandler({ children }: OfflineStateProps) {
  const { isOnline, isSlowConnection, lastOnline, retryConnection } =
    useNetworkState();

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Card className="p-8 text-center max-w-md">
          <WifiOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Internet Connection</h3>
          <p className="text-muted-foreground mb-6">
            Please check your internet connection and try again.
          </p>

          {lastOnline && (
            <p className="text-sm text-muted-foreground mb-4">
              Last connected: {lastOnline.toLocaleTimeString()}
            </p>
          )}

          <Button onClick={retryConnection} className="w-full">
            <Wifi className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Slow connection detected. Some features may take longer to load.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

// ============ Data Validation Utilities ============

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PortfolioDataValidator {
  static validateAddress(address: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!address) {
      errors.push("Address is required");
      return { isValid: false, errors, warnings };
    }

    // Normalize address
    const normalizedAddress = address.startsWith("0x")
      ? address
      : `0x${address}`;

    // Validate format
    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedAddress)) {
      errors.push(
        "Invalid Aptos address format. Address must be 64 hexadecimal characters.",
      );
      return { isValid: false, errors, warnings };
    }

    // Check for common mistakes
    if (address.length < 66 && !address.startsWith("0x")) {
      warnings.push("Address should include 0x prefix");
    }

    if (
      normalizedAddress ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      warnings.push("This appears to be a zero address");
    }

    return { isValid: true, errors, warnings };
  }

  static validateAssets(
    assets: Array<Record<string, unknown>>,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(assets)) {
      errors.push("Assets must be an array");
      return { isValid: false, errors, warnings };
    }

    assets.forEach((item, _index) => {
      if (!asset) {
        errors.push(`Asset at index ${index} is null or undefined`);
        return;
      }

      if (
        typeof asset.amount !== "string" &&
        typeof asset.amount !== "number"
      ) {
        errors.push(`Asset at index ${index} has invalid amount`);
      }

      if (!asset.asset_type && !asset.metadata?.name) {
        warnings.push(
          `Asset at index ${index} is missing name/type information`,
        );
      }

      // Check for suspiciously large values that might indicate data corruption
      const amount = parseFloat(asset.amount?.toString() || "0");
      if (amount > 1e15) {
        // Arbitrary large number check
        warnings.push(
          `Asset at index ${index} has unusually large amount: ${amount}`,
        );
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateNFTs(nfts: Array<Record<string, unknown>>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(nfts)) {
      errors.push("NFTs must be an array");
      return { isValid: false, errors, warnings };
    }

    nfts.forEach((item, _index) => {
      if (!nft) {
        errors.push(`NFT at index ${index} is null or undefined`);
        return;
      }

      if (!nft.token_data_id && !nft.current_token_data) {
        errors.push(`NFT at index ${index} is missing token data`);
      }

      if (!nft.amount || nft.amount === "0") {
        warnings.push(`NFT at index ${index} has zero amount (may be burned)`);
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }
}

// ============ Data Consistency Checker ============

interface DataConsistencyProps {
  children: ReactNode;
  data: {
    assets?: Array<Record<string, unknown>>;
    nfts?: Array<Record<string, unknown>>;
    defiPositions?: Array<Record<string, unknown>>;
    address?: string;
  };
  onValidationError?: (errors: string[]) => void;
  showWarnings?: boolean;
}

export function DataConsistencyChecker({
  children,
  data,
  onValidationError,
  showWarnings = true,
}: DataConsistencyProps) {
  const [validationResults, setValidationResults] = React.useState<{
    address?: ValidationResult;
    assets?: ValidationResult;
    nfts?: ValidationResult;
  }>({});

  React.useEffect(() => {
    const results: typeof validationResults = {};

    if (data.address) {
      results.address = PortfolioDataValidator.validateAddress(data.address);
    }

    if (data.assets) {
      results.assets = PortfolioDataValidator.validateAssets(data.assets);
    }

    if (data.nfts) {
      results.nfts = PortfolioDataValidator.validateNFTs(data.nfts);
    }

    setValidationResults(results);

    // Collect all errors
    const allErrors = Object.values(results).flatMap(
      (result) => result?.errors || [],
    );
    if (allErrors.length > 0) {
      onValidationError?.(allErrors);
    }
  }, [data.address, data.assets, data.nfts, onValidationError]);

  const hasErrors = Object.values(validationResults).some(
    (result) => result && !result.isValid,
  );
  const warnings = Object.values(validationResults).flatMap(
    (result) => result?.warnings || [],
  );

  if (hasErrors) {
    const errors = Object.values(validationResults).flatMap(
      (result) => result?.errors || [],
    );

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium">Data validation errors:</p>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {errors.map((item, _index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showWarnings && warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium">Data warnings:</p>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {warnings.map((item, _index) => (
                  <li key={index} className="text-sm">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
}

// ============ Browser Compatibility Checker ============

export function useBrowserCompatibility() {
  const [compatibility, setCompatibility] = React.useState<{
    isSupported: boolean;
    missingFeatures: string[];
    browserInfo: string;
  }>({
    isSupported: true,
    missingFeatures: [],
    browserInfo: "",
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const missingFeatures: string[] = [];

    // Check for modern browser features
    const requiredFeatures = {
      fetch: () => typeof fetch !== "undefined",
      "Intersection Observer": () => "IntersectionObserver" in window,
      "CSS Grid": () => CSS.supports("display", "grid"),
      "CSS Flexbox": () => CSS.supports("display", "flex"),
      "Local Storage": () => {
        try {
          localStorage.setItem("test", "test");
          localStorage.removeItem("test");
          return true;
        } catch {
          return false;
        }
      },
      WebGL: () => {
        try {
          const canvas = document.createElement("canvas");
          return !!(
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl")
          );
        } catch {
          return false;
        }
      },
    };

    Object.entries(requiredFeatures).forEach(([name, check]) => {
      if (!check()) {
        missingFeatures.push(name);
      }
    });

    const browserInfo = navigator.userAgent;
    const isSupported = missingFeatures.length === 0;

    setCompatibility({
      isSupported,
      missingFeatures,
      browserInfo,
    });
  }, []);

  return compatibility;
}

interface BrowserCompatibilityGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function BrowserCompatibilityGuard({
  children,
  fallback,
}: BrowserCompatibilityGuardProps) {
  const { isSupported, missingFeatures } = useBrowserCompatibility();

  if (!isSupported) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Browser Not Supported</h3>
          <p className="text-muted-foreground mb-4">
            Your browser is missing some features required for this application:
          </p>

          <ul className="text-left list-disc pl-4 mb-6 space-y-1 text-sm">
            {missingFeatures.map((item, _index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">
            Please update your browser or try a modern browser like Chrome,
            Firefox, or Safari.
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
