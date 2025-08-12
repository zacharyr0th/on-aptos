import { TokenRegistry } from "./token-registry";

/**
 * Unified asset validation utilities
 * Consolidates all asset validation logic from scattered locations
 */

export interface ValidationResult {
  isValid: boolean;
  isVerified: boolean;
  isScam: boolean;
  isLegitimate: boolean;
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
  metadata?: {
    isStablecoin?: boolean;
    isLiquidStaking?: boolean;
    isNativeToken?: boolean;
    protocolVerified?: boolean;
  };
}

export interface AssetValidationOptions {
  checkBalance?: boolean;
  balanceThreshold?: number;
  strictMode?: boolean;
}

export class UnifiedAssetValidator {
  /**
   * Known scam patterns and blacklisted addresses
   */
  private static readonly SCAM_PATTERNS = [
    /test/i,
    /fake/i,
    /scam/i,
    /airdrop/i,
    /reward/i,
    /bonus/i,
    /gift/i,
    /claim/i,
    /free/i,
    /hack/i,
    /exploit/i,
  ];

  /**
   * Known malicious or fake token addresses
   */
  private static readonly BLACKLISTED_ADDRESSES = new Set([
    // Add known scam addresses here
    "0x0000000000000000000000000000000000000000000000000000000000000001", // Example
  ]);

  /**
   * Legitimate stablecoin addresses for validation
   */
  private static readonly LEGITIMATE_STABLECOINS = new Set([
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::DAI",
  ]);

  /**
   * Comprehensive asset validation
   */
  static validateAsset(
    address: string,
    symbol?: string,
    balance?: number,
    options: AssetValidationOptions = {},
  ): ValidationResult {
    const {
      checkBalance = true,
      balanceThreshold = 1000000,
      strictMode = false,
    } = options;

    const warnings: string[] = [];
    let isScam = false;
    let riskLevel: "low" | "medium" | "high" = "low";

    // Check if blacklisted
    if (this.BLACKLISTED_ADDRESSES.has(address)) {
      isScam = true;
      riskLevel = "high";
      warnings.push("Address is blacklisted as malicious");
    }

    // Check for scam patterns
    if (this.hasScamPatterns(address, symbol)) {
      isScam = true;
      riskLevel = "high";
      warnings.push("Contains suspicious patterns");
    }

    // Check for fake tokens
    if (this.isFakeToken(address, symbol)) {
      isScam = true;
      riskLevel = "high";
      warnings.push("Potentially fake token");
    }

    // Check balance anomalies
    if (
      checkBalance &&
      balance &&
      this.hasSuspiciousBalance(balance, balanceThreshold)
    ) {
      riskLevel = riskLevel === "high" ? "high" : "medium";
      warnings.push("Suspiciously high balance");
    }

    // Determine if legitimate
    const isLegitimate = this.isLegitimateToken(address, symbol);
    const isVerified = this.isVerifiedToken(address, symbol);

    // In strict mode, only verified tokens are considered safe
    if (strictMode && !isVerified) {
      riskLevel = riskLevel === "low" ? "medium" : riskLevel;
      warnings.push("Token not verified in strict mode");
    }

    // Generate metadata
    const metadata = {
      isStablecoin: TokenRegistry.isStablecoin(address, symbol),
      isLiquidStaking: TokenRegistry.isLiquidStakingToken(address),
      isNativeToken: TokenRegistry.isNativeAPT(address),
      protocolVerified: this.isProtocolToken(address),
    };

    return {
      isValid: !isScam,
      isVerified,
      isScam,
      isLegitimate,
      riskLevel,
      warnings,
      metadata,
    };
  }

  /**
   * Quick scam check for filtering
   */
  static isScamToken(address: string, symbol?: string): boolean {
    return (
      this.BLACKLISTED_ADDRESSES.has(address) ||
      this.hasScamPatterns(address, symbol) ||
      this.isFakeToken(address, symbol)
    );
  }

  /**
   * Check if token is legitimate and safe to display
   */
  static isLegitimateToken(address: string, symbol?: string): boolean {
    // Native tokens are always legitimate
    if (TokenRegistry.isNativeAPT(address)) return true;

    // Verified stablecoins are legitimate
    if (
      TokenRegistry.isStablecoin(address, symbol) &&
      this.isLegitimateStablecoin(address)
    )
      return true;

    // Known protocol tokens are legitimate
    if (this.isProtocolToken(address)) return true;

    // Liquid staking tokens from known protocols
    if (TokenRegistry.isLiquidStakingToken(address)) return true;

    // Check if it's in the token registry (implies some level of verification)
    const knownSymbol = TokenRegistry.getSymbolFromAddress(address);
    if (knownSymbol !== "UNKNOWN") return true;

    return false;
  }

  /**
   * Check if stablecoin is legitimate (not fake)
   */
  static isLegitimateStablecoin(address: string): boolean {
    return this.LEGITIMATE_STABLECOINS.has(address);
  }

  /**
   * Check if token is verified/trusted
   */
  static isVerifiedToken(address: string, _symbol?: string): boolean {
    // Native APT is always verified
    if (TokenRegistry.isNativeAPT(address)) return true;

    // Legitimate stablecoins are verified
    if (this.isLegitimateStablecoin(address)) return true;

    // Known protocol tokens are verified
    if (this.isProtocolToken(address)) return true;

    // Check token registry for verified status
    const registeredSymbol = TokenRegistry.getSymbolFromAddress(address);
    return registeredSymbol !== "UNKNOWN";
  }

  /**
   * Validate a batch of assets efficiently
   */
  static validateBatch(
    assets: Array<{
      address: string;
      symbol?: string;
      balance?: number;
    }>,
    options: AssetValidationOptions = {},
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    assets.forEach(({ address, symbol, balance }) => {
      const validation = this.validateAsset(address, symbol, balance, options);
      results.set(address, validation);
    });

    return results;
  }

  /**
   * Filter assets by validation criteria
   */
  static filterAssets<
    T extends {
      asset_type: string;
      metadata?: { symbol?: string };
      balance?: number;
    },
  >(
    assets: T[],
    criteria: {
      excludeScam?: boolean;
      requireVerified?: boolean;
      requireLegitimate?: boolean;
      maxRiskLevel?: "low" | "medium" | "high";
    } = {},
  ): T[] {
    const {
      excludeScam = true,
      requireVerified = false,
      requireLegitimate = false,
      maxRiskLevel = "high",
    } = criteria;

    const riskLevels = { low: 1, medium: 2, high: 3 };
    const maxRisk = riskLevels[maxRiskLevel];

    return assets.filter((asset) => {
      const validation = this.validateAsset(
        asset.asset_type,
        asset.metadata?.symbol,
        asset.balance,
      );

      if (excludeScam && validation.isScam) return false;
      if (requireVerified && !validation.isVerified) return false;
      if (requireLegitimate && !validation.isLegitimate) return false;
      if (riskLevels[validation.riskLevel] > maxRisk) return false;

      return true;
    });
  }

  /**
   * Get validation summary for a list of assets
   */
  static getValidationSummary(
    assets: Array<{
      address: string;
      symbol?: string;
      balance?: number;
    }>,
  ): {
    total: number;
    valid: number;
    scam: number;
    verified: number;
    legitimate: number;
    riskBreakdown: Record<"low" | "medium" | "high", number>;
    topWarnings: Array<{ warning: string; count: number }>;
  } {
    const validations = this.validateBatch(assets);
    const results = Array.from(validations.values());

    const summary = {
      total: assets.length,
      valid: results.filter((r) => r.isValid).length,
      scam: results.filter((r) => r.isScam).length,
      verified: results.filter((r) => r.isVerified).length,
      legitimate: results.filter((r) => r.isLegitimate).length,
      riskBreakdown: { low: 0, medium: 0, high: 0 } as Record<
        "low" | "medium" | "high",
        number
      >,
      topWarnings: [] as Array<{ warning: string; count: number }>,
    };

    // Count risk levels
    results.forEach((result) => {
      summary.riskBreakdown[result.riskLevel]++;
    });

    // Count warnings
    const warningCounts = new Map<string, number>();
    results.forEach((result) => {
      result.warnings.forEach((warning) => {
        warningCounts.set(warning, (warningCounts.get(warning) || 0) + 1);
      });
    });

    // Get top warnings
    summary.topWarnings = Array.from(warningCounts.entries())
      .map(([warning, count]) => ({ warning, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return summary;
  }

  /**
   * Check for scam patterns in address or symbol
   */
  private static hasScamPatterns(address: string, symbol?: string): boolean {
    return this.SCAM_PATTERNS.some((pattern) => {
      return pattern.test(address) || (symbol && pattern.test(symbol));
    });
  }

  /**
   * Check if token is a fake version of a legitimate token
   */
  private static isFakeToken(address: string, symbol?: string): boolean {
    // Check for fake APT tokens
    if (
      symbol?.toUpperCase() === "APT" &&
      !TokenRegistry.isNativeAPT(address)
    ) {
      return true;
    }

    // Check for fake stablecoins
    if (
      symbol &&
      TokenRegistry.isStablecoin(address, symbol) &&
      !this.isLegitimateStablecoin(address)
    ) {
      return true;
    }

    // Check for fake protocol tokens
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      const knownAddresses = ["THL", "MOD", "CAKE"];

      if (knownAddresses.includes(upperSymbol)) {
        const expectedAddress = TokenRegistry.getAddressFromSymbol(upperSymbol);
        if (expectedAddress && expectedAddress !== address) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if balance is suspiciously high (possible airdrop scam)
   */
  private static hasSuspiciousBalance(
    balance: number,
    threshold: number,
  ): boolean {
    return balance > threshold;
  }

  /**
   * Check if address belongs to a known protocol
   */
  private static isProtocolToken(address: string): boolean {
    // Check against known protocol token addresses
    const knownProtocolTokens = [
      "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
      "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
      "0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT",
    ];

    return knownProtocolTokens.includes(address);
  }

  /**
   * Add address to blacklist (runtime)
   */
  static addToBlacklist(address: string): void {
    this.BLACKLISTED_ADDRESSES.add(address);
  }

  /**
   * Remove address from blacklist (runtime)
   */
  static removeFromBlacklist(address: string): void {
    this.BLACKLISTED_ADDRESSES.delete(address);
  }

  /**
   * Check if address is blacklisted
   */
  static isBlacklisted(address: string): boolean {
    return this.BLACKLISTED_ADDRESSES.has(address);
  }

  /**
   * Get all blacklisted addresses
   */
  static getBlacklist(): string[] {
    return Array.from(this.BLACKLISTED_ADDRESSES);
  }
}
