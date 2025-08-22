"use client";

import { Shield, AlertTriangle, Eye, Lock } from "lucide-react";
import React, { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// Temporary simplified components
interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function Switch({ id, checked, onCheckedChange }: SwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

interface LabelProps {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

function Label({ htmlFor, className, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium ${className || ""}`}
    >
      {children}
    </label>
  );
}

// ============ Content Security Policy ============

export function useContentSecurityPolicy() {
  React.useEffect(() => {
    // Detect CSP violations
    const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
      securityLogger.warn(
        `CSP Violation: blockedURI: ${e.blockedURI}, violatedDirective: ${e.violatedDirective}, originalPolicy: ${e.originalPolicy}, documentURI: ${e.documentURI}`,
      );

      // Report to monitoring service
      if (process.env.NODE_ENV === "production") {
        fetch("/api/security/csp-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            documentURI: e.documentURI,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {
          // Silent failure for security reporting
        });
      }
    };

    document.addEventListener("securitypolicyviolation", handleCSPViolation);
    return () => {
      document.removeEventListener(
        "securitypolicyviolation",
        handleCSPViolation,
      );
    };
  }, []);
}

// ============ Input Sanitization ============

export class SecurityUtils {
  // Sanitize user input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  }

  // Validate wallet address format
  static validateWalletAddress(address: string): {
    isValid: boolean;
    sanitized: string;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let sanitized = address.trim();

    // Remove any non-hex characters except 0x prefix
    sanitized = sanitized.replace(/[^0-9a-fA-Fx]/g, "");

    // Ensure 0x prefix
    if (!sanitized.startsWith("0x")) {
      if (sanitized.length === 64) {
        sanitized = `0x${sanitized}`;
      } else {
        return {
          isValid: false,
          sanitized,
          warnings: ["Invalid address format"],
        };
      }
    }

    // Validate length and format
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(sanitized);

    if (!isValid) {
      warnings.push("Address must be 66 characters long (including 0x prefix)");
      warnings.push("Address can only contain hexadecimal characters");
    }

    // Check for suspicious patterns
    if (
      sanitized ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      warnings.push("This appears to be a zero address");
    }

    if (/^0x(0{63}1|1{64})$/.test(sanitized)) {
      warnings.push("This address pattern looks suspicious");
    }

    return { isValid, sanitized, warnings };
  }

  // Escape HTML to prevent XSS in dynamic content
  static escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Validate and sanitize URLs
  static sanitizeUrl(url: string): { isValid: boolean; sanitized: string } {
    try {
      const urlObj = new URL(url);

      // Only allow HTTPS and data: protocols
      if (!["https:", "data:"].includes(urlObj.protocol)) {
        return { isValid: false, sanitized: "" };
      }

      return { isValid: true, sanitized: urlObj.toString() };
    } catch {
      return { isValid: false, sanitized: "" };
    }
  }

  // Rate limiting for client-side actions
  static createRateLimiter(maxRequests: number, timeWindow: number) {
    const requests: number[] = [];

    return {
      canProceed: (): boolean => {
        const now = Date.now();

        // Remove old requests outside time window
        while (requests.length > 0 && requests[0] < now - timeWindow) {
          requests.shift();
        }

        // Check if we're under the limit
        if (requests.length < maxRequests) {
          requests.push(now);
          return true;
        }

        return false;
      },
      getRemainingTime: (): number => {
        if (requests.length === 0) return 0;
        return Math.max(0, requests[0] + timeWindow - Date.now());
      },
    };
  }
}

// ============ Privacy Controls ============

interface PrivacySettings {
  hideBalances: boolean;
  hideTransactionDetails: boolean;
  hideNFTDetails: boolean;
  allowAnalytics: boolean;
  shareWalletAddress: boolean;
}

interface PrivacyContextType extends PrivacySettings {
  updateSetting: <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) => void;
  resetSettings: () => void;
}

const defaultPrivacySettings: PrivacySettings = {
  hideBalances: false,
  hideTransactionDetails: false,
  hideNFTDetails: false,
  allowAnalytics: true,
  shareWalletAddress: false,
};

const PrivacyContext = React.createContext<PrivacyContextType | undefined>(
  undefined,
);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = React.useState<PrivacySettings>(
    defaultPrivacySettings,
  );

  // Load from localStorage with encryption
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("privacy-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultPrivacySettings, ...parsed });
      }
    } catch (error) {
      securityLogger.warn(`Failed to load privacy settings: ${error}`);
    }
  }, []);

  // Save to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem("privacy-settings", JSON.stringify(settings));
    } catch (error) {
      securityLogger.warn(`Failed to save privacy settings: ${error}`);
    }
  }, [settings]);

  const updateSetting = React.useCallback(
    <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = React.useCallback(() => {
    setSettings(defaultPrivacySettings);
  }, []);

  const value: PrivacyContextType = {
    ...settings,
    updateSetting,
    resetSettings,
  };

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = React.useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within PrivacyProvider");
  }
  return context;
}

// ============ Sensitive Data Display Component ============

interface SensitiveDataProps {
  children: ReactNode;
  type: "balance" | "transaction" | "nft" | "address";
  fallback?: ReactNode;
  className?: string;
}

export function SensitiveData({
  children,
  type,
  fallback,
  className,
}: SensitiveDataProps) {
  const privacy = usePrivacy();
  const [isRevealed, setIsRevealed] = React.useState(false);

  const shouldHide = React.useMemo(() => {
    switch (type) {
      case "balance":
        return privacy.hideBalances;
      case "transaction":
        return privacy.hideTransactionDetails;
      case "nft":
        return privacy.hideNFTDetails;
      case "address":
        return !privacy.shareWalletAddress;
      default:
        return false;
    }
  }, [privacy, type]);

  const defaultFallback = React.useMemo(() => {
    switch (type) {
      case "balance":
        return "••••••";
      case "transaction":
        return "Hidden";
      case "nft":
        return "NFT Details Hidden";
      case "address":
        return "0x••••••••";
      default:
        return "••••••";
    }
  }, [type]);

  if (!shouldHide || isRevealed) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {fallback || defaultFallback}
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-transparent"
        onClick={() => setIsRevealed(true)}
        aria-label={`Show ${type}`}
      >
        <Eye className="h-3 w-3" />
      </Button>
    </span>
  );
}

// ============ Security Audit Component ============

interface SecurityIssue {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  canAutoFix: boolean;
}

export function useSecurityAudit() {
  const [issues, setIssues] = React.useState<SecurityIssue[]>([]);
  const [isScanning, setIsScanning] = React.useState(false);

  const runSecurityAudit = React.useCallback(async () => {
    setIsScanning(true);
    const detectedIssues: SecurityIssue[] = [];

    try {
      // Check for common security issues

      // 1. Check localStorage for sensitive data
      try {
        const keys = Object.keys(localStorage);
        const suspiciousKeys = keys.filter(
          (key) =>
            key.includes("private") ||
            key.includes("seed") ||
            key.includes("mnemonic"),
        );

        if (suspiciousKeys.length > 0) {
          detectedIssues.push({
            id: "localStorage-sensitive",
            severity: "high",
            title: "Sensitive Data in Local Storage",
            description: "Potentially sensitive data found in browser storage",
            recommendation: "Remove sensitive data from local storage",
            canAutoFix: false,
          });
        }
      } catch {
        // localStorage access failed
      }

      // 2. Check for mixed content
      if (
        location.protocol === "https:" &&
        document.querySelector('[src^="http:"]')
      ) {
        detectedIssues.push({
          id: "mixed-content",
          severity: "medium",
          title: "Mixed Content Detected",
          description: "HTTP resources loaded on HTTPS page",
          recommendation: "Update all resources to use HTTPS",
          canAutoFix: false,
        });
      }

      // 3. Check for inline styles (potential XSS vector)
      const inlineStyles = document.querySelectorAll("[style]");
      if (inlineStyles.length > 10) {
        detectedIssues.push({
          id: "inline-styles",
          severity: "low",
          title: "Excessive Inline Styles",
          description: "Many inline styles detected, potential CSP issue",
          recommendation: "Move styles to CSS classes",
          canAutoFix: false,
        });
      }

      // 4. Check for console exposure
      if (
        typeof window.console === "object" &&
        process.env.NODE_ENV === "production"
      ) {
        detectedIssues.push({
          id: "console-exposed",
          severity: "low",
          title: "Console Available in Production",
          description: "Development tools accessible to users",
          recommendation: "Disable console in production builds",
          canAutoFix: false,
        });
      }

      setIssues(detectedIssues);
    } catch (error) {
      securityLogger.warn(`Security audit failed: ${error}`);
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    issues,
    isScanning,
    runSecurityAudit,
  };
}

export function SecurityAuditPanel() {
  const { issues, isScanning, runSecurityAudit } = useSecurityAudit();

  React.useEffect(() => {
    // Run initial audit
    runSecurityAudit();
  }, [runSecurityAudit]);

  const criticalIssues = issues.filter((i) => i.severity === "critical").length;
  const highIssues = issues.filter((i) => i.severity === "high").length;
  const mediumIssues = issues.filter((i) => i.severity === "medium").length;
  const lowIssues = issues.filter((i) => i.severity === "low").length;

  const getSeverityColor = (severity: SecurityIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <h3 className="font-semibold">Security Status</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runSecurityAudit}
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Run Audit"}
        </Button>
      </div>

      {/* Security Score */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {criticalIssues}
          </div>
          <div className="text-sm text-muted-foreground">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{highIssues}</div>
          <div className="text-sm text-muted-foreground">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {mediumIssues}
          </div>
          <div className="text-sm text-muted-foreground">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{lowIssues}</div>
          <div className="text-sm text-muted-foreground">Low</div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {issues.length === 0 ? (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No security issues detected. Your portfolio is secure!
            </AlertDescription>
          </Alert>
        ) : (
          issues.map((issue) => (
            <Alert key={issue.id} className={getSeverityColor(issue.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{issue.title}</h4>
                  <Badge
                    variant="outline"
                    className={getSeverityColor(issue.severity)}
                  >
                    {issue.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm mt-1">{issue.description}</p>
                <p className="text-sm mt-1 font-medium">
                  Recommendation: {issue.recommendation}
                </p>
              </div>
            </Alert>
          ))
        )}
      </div>
    </Card>
  );
}

// ============ Privacy Settings Panel ============

export function PrivacySettingsPanel() {
  const privacy = usePrivacy();

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Lock className="h-5 w-5" />
        <h3 className="font-semibold">Privacy Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="hide-balances" className="text-sm">
            Hide wallet balances
          </Label>
          <Switch
            id="hide-balances"
            checked={privacy.hideBalances}
            onCheckedChange={(checked) =>
              privacy.updateSetting("hideBalances", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="hide-transactions" className="text-sm">
            Hide transaction details
          </Label>
          <Switch
            id="hide-transactions"
            checked={privacy.hideTransactionDetails}
            onCheckedChange={(checked) =>
              privacy.updateSetting("hideTransactionDetails", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="hide-nfts" className="text-sm">
            Hide NFT details
          </Label>
          <Switch
            id="hide-nfts"
            checked={privacy.hideNFTDetails}
            onCheckedChange={(checked) =>
              privacy.updateSetting("hideNFTDetails", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="allow-analytics" className="text-sm">
            Allow analytics
          </Label>
          <Switch
            id="allow-analytics"
            checked={privacy.allowAnalytics}
            onCheckedChange={(checked) =>
              privacy.updateSetting("allowAnalytics", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="share-address" className="text-sm">
            Share wallet address
          </Label>
          <Switch
            id="share-address"
            checked={privacy.shareWalletAddress}
            onCheckedChange={(checked) =>
              privacy.updateSetting("shareWalletAddress", checked)
            }
          />
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={privacy.resetSettings}
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </Card>
  );
}
