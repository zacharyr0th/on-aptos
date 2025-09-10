/**
 * Runtime validation utilities for yield services
 * Provides type checking and data sanitization at runtime
 */

import { logger } from "@/lib/utils/core/logger";
import type {
  CompoundablePosition,
  HarvestablePosition,
  ProtocolOpportunity,
  YieldOpportunity,
  YieldStrategy,
  YieldStrategyStep,
} from "./types";

/**
 * Validates if a value is a valid Aptos address
 */
export function isValidAptosAddress(address: string): boolean {
  if (typeof address !== "string") return false;

  // Aptos addresses are hex strings that start with 0x and are up to 66 characters
  const addressRegex = /^0x[a-fA-F0-9]{1,64}$/;
  return addressRegex.test(address);
}

/**
 * Validates if a number is a valid APY (0-10000%)
 */
export function isValidAPY(apy: number): boolean {
  return typeof apy === "number" && !isNaN(apy) && apy >= 0 && apy <= 10000;
}

/**
 * Validates if a number is a valid TVL (non-negative)
 */
export function isValidTVL(tvl: number): boolean {
  return typeof tvl === "number" && !isNaN(tvl) && tvl >= 0;
}

/**
 * Validates risk level
 */
export function isValidRisk(risk: string): risk is "low" | "medium" | "high" {
  return ["low", "medium", "high"].includes(risk);
}

/**
 * Validates opportunity type
 */
export function isValidOpportunityType(
  type: string
): type is "lending" | "liquidity" | "staking" | "farming" | "vault" {
  return ["lending", "liquidity", "staking", "farming", "vault"].includes(type);
}

/**
 * Sanitizes and validates YieldOpportunity object
 */
export function validateYieldOpportunity(opportunity: unknown): opportunity is YieldOpportunity {
  try {
    if (!opportunity || typeof opportunity !== "object") {
      logger.warn("Invalid opportunity: not an object");
      return false;
    }

    // Required fields
    if (typeof (opportunity as any).id !== "string" || !(opportunity as any).id.trim()) {
      logger.warn("Invalid opportunity: missing or invalid id");
      return false;
    }

    if (
      typeof (opportunity as any).protocol !== "string" ||
      !(opportunity as any).protocol.trim()
    ) {
      logger.warn("Invalid opportunity: missing or invalid protocol");
      return false;
    }

    if (!isValidOpportunityType((opportunity as any).opportunityType)) {
      logger.warn(
        `Invalid opportunity: invalid opportunityType ${(opportunity as any).opportunityType}`
      );
      return false;
    }

    if (
      typeof (opportunity as any).assetSymbol !== "string" ||
      !(opportunity as any).assetSymbol.trim()
    ) {
      logger.warn("Invalid opportunity: missing or invalid assetSymbol");
      return false;
    }

    if (!isValidAPY((opportunity as any).apy)) {
      logger.warn(`Invalid opportunity: invalid APY ${(opportunity as any).apy}`);
      return false;
    }

    if (!isValidTVL((opportunity as any).tvl)) {
      logger.warn(`Invalid opportunity: invalid TVL ${(opportunity as any).tvl}`);
      return false;
    }

    if (!isValidRisk((opportunity as any).risk)) {
      logger.warn(`Invalid opportunity: invalid risk ${(opportunity as any).risk}`);
      return false;
    }

    if (!Array.isArray((opportunity as any).features)) {
      logger.warn("Invalid opportunity: features must be an array");
      return false;
    }

    if (typeof (opportunity as any).isActive !== "boolean") {
      logger.warn("Invalid opportunity: isActive must be boolean");
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error validating yield opportunity:", error);
    return false;
  }
}

/**
 * Sanitizes and validates ProtocolOpportunity object
 */
export function validateProtocolOpportunity(
  opportunity: unknown
): opportunity is ProtocolOpportunity {
  try {
    if (!opportunity || typeof opportunity !== "object") {
      return false;
    }

    // Similar validation to YieldOpportunity but with required fields only
    const hasRequiredFields =
      typeof (opportunity as any).id === "string" &&
      typeof (opportunity as any).protocol === "string" &&
      isValidOpportunityType((opportunity as any).opportunityType) &&
      typeof (opportunity as any).assetSymbol === "string" &&
      isValidAPY((opportunity as any).apy) &&
      isValidTVL((opportunity as any).tvl) &&
      isValidRisk((opportunity as any).risk) &&
      Array.isArray((opportunity as any).features) &&
      typeof (opportunity as any).isActive === "boolean";

    if (!hasRequiredFields) {
      logger.warn("Invalid protocol opportunity: missing required fields");
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error validating protocol opportunity:", error);
    return false;
  }
}

/**
 * Validates CompoundablePosition
 */
export function validateCompoundablePosition(position: unknown): position is CompoundablePosition {
  try {
    if (!position || typeof position !== "object") {
      return false;
    }

    const isValid =
      typeof (position as any).id === "string" &&
      typeof (position as any).protocol === "string" &&
      typeof (position as any).asset === "string" &&
      typeof (position as any).pendingRewards === "number" &&
      (position as any).pendingRewards >= 0 &&
      typeof (position as any).rewardToken === "string" &&
      typeof (position as any).gasEstimate === "number" &&
      (position as any).gasEstimate >= 0 &&
      typeof (position as any).minRewardThreshold === "number" &&
      (position as any).minRewardThreshold >= 0;

    if (!isValid) {
      logger.warn("Invalid compoundable position: missing or invalid required fields");
    }

    return isValid;
  } catch (error) {
    logger.error("Error validating compoundable position:", error);
    return false;
  }
}

/**
 * Validates HarvestablePosition
 */
export function validateHarvestablePosition(position: unknown): position is HarvestablePosition {
  try {
    if (!position || typeof position !== "object") {
      return false;
    }

    const isValid =
      typeof (position as any).id === "string" &&
      typeof (position as any).protocol === "string" &&
      Array.isArray((position as any).rewards) &&
      (position as any).rewards.every(
        (reward: unknown) =>
          typeof (reward as any).token === "string" &&
          typeof (reward as any).amount === "number" &&
          (reward as any).amount >= 0 &&
          typeof (reward as any).valueUSD === "number" &&
          (reward as any).valueUSD >= 0
      ) &&
      typeof (position as any).gasEstimate === "number" &&
      (position as any).gasEstimate >= 0 &&
      typeof (position as any).profitable === "boolean";

    if (!isValid) {
      logger.warn("Invalid harvestable position: missing or invalid required fields");
    }

    return isValid;
  } catch (error) {
    logger.error("Error validating harvestable position:", error);
    return false;
  }
}

/**
 * Validates YieldStrategy
 */
export function validateYieldStrategy(strategy: unknown): strategy is YieldStrategy {
  try {
    if (!strategy || typeof strategy !== "object") {
      return false;
    }

    const isValid =
      typeof (strategy as any).id === "string" &&
      typeof (strategy as any).name === "string" &&
      typeof (strategy as any).description === "string" &&
      isValidAPY((strategy as any).targetAPY) &&
      ["conservative", "moderate", "aggressive"].includes((strategy as any).risk) &&
      Array.isArray((strategy as any).protocols) &&
      (strategy as any).protocols.every((p: unknown) => typeof p === "string") &&
      typeof (strategy as any).allocation === "object" &&
      Object.values((strategy as any).allocation).every(
        (v: unknown) => typeof v === "number" && v >= 0
      ) &&
      typeof (strategy as any).estimatedGas === "number" &&
      (strategy as any).estimatedGas >= 0 &&
      Array.isArray((strategy as any).steps) &&
      (strategy as any).steps.every((step: unknown) => validateYieldStrategyStep(step));

    if (!isValid) {
      logger.warn("Invalid yield strategy: missing or invalid required fields");
    }

    return isValid;
  } catch (error) {
    logger.error("Error validating yield strategy:", error);
    return false;
  }
}

/**
 * Validates YieldStrategyStep
 */
export function validateYieldStrategyStep(step: unknown): step is YieldStrategyStep {
  try {
    if (!step || typeof step !== "object") {
      return false;
    }

    const isValid =
      typeof (step as any).protocol === "string" &&
      ["deposit", "withdraw", "swap", "stake", "harvest"].includes((step as any).action) &&
      typeof (step as any).asset === "string" &&
      typeof (step as any).amount === "string" &&
      isValidAPY((step as any).estimatedAPY);

    return isValid;
  } catch (error) {
    logger.error("Error validating yield strategy step:", error);
    return false;
  }
}

/**
 * Sanitizes yield opportunities array by filtering out invalid entries
 */
export function sanitizeYieldOpportunities(opportunities: unknown[]): YieldOpportunity[] {
  if (!Array.isArray(opportunities)) {
    logger.warn("Expected array of opportunities, got:", typeof opportunities);
    return [];
  }

  const sanitized = opportunities.filter((opp, index) => {
    const isValid = validateYieldOpportunity(opp);
    if (!isValid) {
      logger.debug(`Filtered out invalid opportunity at index ${index}:`, opp);
    }
    return isValid;
  });

  if (sanitized.length !== opportunities.length) {
    logger.info(`Sanitized ${opportunities.length - sanitized.length} invalid opportunities`);
  }

  return sanitized;
}

/**
 * Sanitizes wallet address input
 */
export function sanitizeWalletAddress(address: string | null | undefined): string | null {
  if (!address || typeof address !== "string") {
    return null;
  }

  const trimmed = address.trim();

  if (!isValidAptosAddress(trimmed)) {
    logger.warn(`Invalid wallet address format: ${trimmed}`);
    return null;
  }

  return trimmed;
}

/**
 * Sanitizes filter parameters for opportunity discovery
 */
export function sanitizeFilters(filters: unknown): {
  minAPY?: number;
  maxRisk?: "low" | "medium" | "high";
  protocols?: string[];
  assets?: string[];
  includeInactive?: boolean;
} {
  if (!filters || typeof filters !== "object") {
    return {};
  }

  const filtersObj = filters as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  // Sanitize minAPY
  if (typeof filtersObj.minAPY === "number" && isValidAPY(filtersObj.minAPY)) {
    sanitized.minAPY = filtersObj.minAPY;
  }

  // Sanitize maxRisk
  if (typeof filtersObj.maxRisk === "string" && isValidRisk(filtersObj.maxRisk)) {
    sanitized.maxRisk = filtersObj.maxRisk;
  }

  // Sanitize protocols array
  if (Array.isArray(filtersObj.protocols)) {
    const validProtocols = filtersObj.protocols
      .filter((p: unknown) => typeof p === "string" && p.trim())
      .map((p: string) => p.trim());
    if (validProtocols.length > 0) {
      sanitized.protocols = validProtocols;
    }
  }

  // Sanitize assets array
  if (Array.isArray(filtersObj.assets)) {
    const validAssets = filtersObj.assets
      .filter((a: unknown) => typeof a === "string" && a.trim())
      .map((a: string) => a.trim());
    if (validAssets.length > 0) {
      sanitized.assets = validAssets;
    }
  }

  // Sanitize includeInactive
  if (typeof filtersObj.includeInactive === "boolean") {
    sanitized.includeInactive = filtersObj.includeInactive;
  }

  return sanitized;
}
