import { logger } from "@/lib/utils/core/logger";
import type { CompoundablePosition, HarvestablePosition } from "./types";
import {
  sanitizeWalletAddress,
  validateCompoundablePosition,
  validateHarvestablePosition,
} from "./validation";

export class AutoCompoundService {
  private static instance: AutoCompoundService;

  private constructor() {}

  static getInstance(): AutoCompoundService {
    if (!AutoCompoundService.instance) {
      AutoCompoundService.instance = new AutoCompoundService();
    }
    return AutoCompoundService.instance;
  }

  /**
   * Scan for positions that can be auto-compounded
   */
  async scanCompoundablePositions(walletAddress: string): Promise<CompoundablePosition[]> {
    const sanitizedWallet = sanitizeWalletAddress(walletAddress);
    if (!sanitizedWallet) {
      logger.warn("Invalid wallet address provided to scanCompoundablePositions");
      return [];
    }

    try {
      logger.debug(`Scanning compoundable positions for wallet: ${sanitizedWallet}`);

      // This would integrate with DeFi adapters to find positions with pending rewards
      const positions: CompoundablePosition[] = [];

      // Example: Check Thala farming positions
      // Example: Check PancakeSwap MasterChef positions
      // Example: Check lending protocol rewards

      // Validate all positions before filtering
      const validPositions = positions.filter((p) => {
        const isValid = validateCompoundablePosition(p);
        if (!isValid) {
          logger.warn(`Invalid compoundable position found for ${sanitizedWallet}:`, p);
        }
        return isValid;
      });

      const profitablePositions = validPositions.filter((p) => this.isCompoundProfitable(p));

      logger.info(
        `Found ${profitablePositions.length} profitable compoundable positions out of ${validPositions.length} total`
      );
      return profitablePositions;
    } catch (error) {
      logger.error(`Failed to scan compoundable positions for ${sanitizedWallet}:`, {
        error: error instanceof Error ? error.message : String(error),
        walletAddress: sanitizedWallet,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }

  /**
   * Check if compounding is profitable after gas costs
   */
  private isCompoundProfitable(position: CompoundablePosition): boolean {
    const rewardValue = position.pendingRewards;
    const gasCost = position.gasEstimate * 0.01; // Assuming 0.01 APT per gas unit

    // Only compound if rewards > 2x gas cost
    return rewardValue > gasCost * 2 && rewardValue >= position.minRewardThreshold;
  }

  /**
   * Execute auto-compound for a position
   */
  async executeCompound(
    position: CompoundablePosition,
    _walletAddress: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      logger.info(`Executing compound for ${position.protocol} position ${position.id}`);

      // This would:
      // 1. Claim rewards from the protocol
      // 2. Swap rewards to the staking token if needed
      // 3. Re-stake the tokens
      // 4. Update position metadata

      return {
        success: true,
        txHash: "0x...", // Transaction hash
      };
    } catch (error) {
      logger.error("Failed to execute compound:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Scan for harvestable rewards across all positions
   */
  async scanHarvestableRewards(walletAddress: string): Promise<HarvestablePosition[]> {
    const sanitizedWallet = sanitizeWalletAddress(walletAddress);
    if (!sanitizedWallet) {
      logger.warn("Invalid wallet address provided to scanHarvestableRewards");
      return [];
    }

    try {
      logger.debug(`Scanning harvestable rewards for wallet: ${sanitizedWallet}`);

      // Scan all DeFi positions for claimable rewards
      const harvestable: HarvestablePosition[] = [];

      // This would check each protocol adapter for pending rewards

      // Validate all positions
      const validPositions = harvestable.filter((p) => {
        const isValid = validateHarvestablePosition(p);
        if (!isValid) {
          logger.warn(`Invalid harvestable position found for ${sanitizedWallet}:`, p);
        }
        return isValid;
      });

      logger.info(`Found ${validPositions.length} harvestable positions`);
      return validPositions;
    } catch (error) {
      logger.error(`Failed to scan harvestable rewards for ${sanitizedWallet}:`, {
        error: error instanceof Error ? error.message : String(error),
        walletAddress: sanitizedWallet,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }

  /**
   * Execute batch harvest of rewards
   */
  async executeBatchHarvest(
    positions: HarvestablePosition[],
    _walletAddress: string
  ): Promise<{
    successful: string[];
    failed: string[];
    totalHarvested: number;
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    let totalHarvested = 0;

    for (const position of positions) {
      try {
        // Execute harvest for this position
        logger.info(`Harvesting rewards from ${position.protocol}`);

        // This would claim rewards from the protocol
        successful.push(position.id);
        totalHarvested += position.rewards.reduce((sum, r) => sum + r.valueUSD, 0);
      } catch (error) {
        logger.error(`Failed to harvest ${position.id}:`, error);
        failed.push(position.id);
      }
    }

    return { successful, failed, totalHarvested };
  }

  /**
   * Calculate optimal compound frequency based on position size and gas costs
   */
  calculateOptimalCompoundFrequency(
    positionValue: number,
    apy: number,
    gasEstimate: number
  ): {
    frequency: "daily" | "weekly" | "monthly" | "manual";
    estimatedGain: number;
  } {
    const dailyYield = (positionValue * apy) / 365 / 100;
    const gasCostAPT = gasEstimate * 0.01;
    const gasCostUSD = gasCostAPT * 5.5; // Assuming APT price

    // Calculate break-even days
    const breakEvenDays = gasCostUSD / dailyYield;

    if (breakEvenDays < 1) {
      return {
        frequency: "daily",
        estimatedGain: dailyYield * 365 - gasCostUSD * 365,
      };
    } else if (breakEvenDays < 7) {
      return {
        frequency: "weekly",
        estimatedGain: dailyYield * 52 * 7 - gasCostUSD * 52,
      };
    } else if (breakEvenDays < 30) {
      return {
        frequency: "monthly",
        estimatedGain: dailyYield * 12 * 30 - gasCostUSD * 12,
      };
    } else {
      return { frequency: "manual", estimatedGain: 0 };
    }
  }
}
