/**
 * Example usage of the new DeFi Position Provider/Adapter system
 */

import { logger } from "@/lib/utils/logger";

import {
  createDeFiProvider,
  DeFiProviderFactory,
  ThalaAdapter,
  type DeFiProviderConfig,
  type ScanOptions,
} from "../index";

// Example 1: Quick setup with defaults
export async function basicUsage() {
  // Create provider with default configuration
  const provider = createDeFiProvider({
    apiKey: process.env.APTOS_BUILD_SECRET,
    enabledAdapters: ["thala-adapter", "generic-token-adapter"],
  });

  // Initialize all adapters
  await provider.initializeAllAdapters();

  // Scan positions for a wallet
  const walletAddress =
    "0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522";
  const result = await provider.scanPositions(walletAddress);

  logger.info("Total positions found:", result.summary.totalPositions);
  logger.info("Total value USD:", result.summary.totalValueUSD);
  logger.info("Top protocols:", result.summary.topProtocols);

  return result;
}

// Example 2: Advanced configuration
export async function advancedUsage() {
  const config: DeFiProviderConfig = {
    indexerUrl: "https://indexer.mainnet.aptoslabs.com/v1",
    apiKey: process.env.APTOS_BUILD_SECRET,

    // Custom adapter configurations
    adapterConfigs: {
      "thala-adapter": {
        priority: 90,
        timeout: 20000,
        cacheTimeToLive: 300000,
        features: {
          priceCalculation: true,
          rewardTracking: true,
        },
      },
      "generic-token-adapter": {
        priority: 10,
        timeout: 15000,
        features: {
          priceCalculation: true,
        },
      },
    },

    // Custom logger
    logger: {
      info: (msg, data) => logger.info(`[DeFi] ${msg}`, data),
      warn: (msg, data) => logger.warn(`[DeFi] ${msg}`, data),
      error: (msg, error) => logger.error(`[DeFi] ${msg}`, error),
      debug: (msg, data) => logger.debug(`[DeFi] ${msg}`, data),
    },
  };

  const provider = await DeFiProviderFactory.createAndInitialize(config);

  // Scan with specific options
  const scanOptions: ScanOptions = {
    parallel: true,
    timeout: 30000,
    minValueUSD: 1.0, // Filter out positions below $1
    includeDust: false,
    skipCache: false,
  };

  const result = await provider.scanPositions(
    "0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522",
    scanOptions,
  );

  return result;
}

// Example 3: Custom adapter registration
export async function customAdapterUsage() {
  const provider = createDeFiProvider();

  // Register a custom adapter
  const customThalaAdapter = new ThalaAdapter({
    priority: 95,
    timeout: 25000,
    features: {
      priceCalculation: true,
      rewardTracking: true,
      historicalData: false,
    },
  });

  provider.registerAdapter(customThalaAdapter);

  // Initialize and scan
  await provider.initializeAllAdapters();

  const result = await provider.scanPositions(
    "0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522",
    { adapters: ["thala-adapter"] }, // Only use Thala adapter
  );

  return result;
}

// Example 4: Health monitoring
export async function healthMonitoring() {
  const provider = createDeFiProvider();
  await provider.initializeAllAdapters();

  // Check provider health
  const health = provider.getProviderHealth();

  logger.info("Provider status:", health.status);
  logger.info("Active adapters:", health.totalActiveAdapters);

  // Check individual adapter health
  for (const adapter of health.adapters) {
    logger.info(`${adapter.name}: ${adapter.status}`);
    if (adapter.issues) {
      logger.info("  Issues:", adapter.issues);
    }
  }

  // Get registry statistics
  const stats = provider.getRegistryStats();
  logger.info("Registry stats:", stats);

  return health;
}

// Example 5: Error handling and retry logic
export async function robustScanWithRetry() {
  const provider = createDeFiProvider();
  await provider.initializeAllAdapters();

  const walletAddress =
    "0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522";
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const result = await provider.scanPositions(walletAddress, {
        timeout: 20000,
        parallel: true,
      });

      logger.info("Scan successful on attempt", attempts + 1);
      return result;
    } catch (error) {
      attempts++;
      logger.error(`Scan attempt ${attempts} failed:`, error);

      if (attempts === maxAttempts) {
        throw new Error(
          `Failed to scan positions after ${maxAttempts} attempts`,
        );
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }
}

// Example 6: Working with specific position types
export async function filterPositionTypes() {
  const provider = createDeFiProvider();
  await provider.initializeAllAdapters();

  const result = await provider.scanPositions(
    "0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522",
  );

  // Filter by position type
  const liquidityPositions = result.positions.filter(
    (pos) => pos.positionType === "liquidity_pool",
  );

  const stakingPositions = result.positions.filter(
    (pos) => pos.positionType === "staking",
  );

  logger.info("Liquidity positions:", liquidityPositions.length);
  logger.info("Staking positions:", stakingPositions.length);

  // Group by protocol
  const positionsByProtocol = result.positions.reduce(
    (groups, position) => {
      if (!groups[position.protocol]) {
        groups[position.protocol] = [];
      }
      groups[position.protocol].push(position);
      return groups;
    },
    {} as Record<string, typeof result.positions>,
  );

  logger.info("Positions by protocol:", Object.keys(positionsByProtocol));

  return { liquidityPositions, stakingPositions, positionsByProtocol };
}
