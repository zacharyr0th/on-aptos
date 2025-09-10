/**
 * Protocol Loader - Dynamic loading system
 */

import { logger } from "@/lib/utils/core/logger";
import { protocolRegistry } from "./registry";
import type { ProtocolDefinition } from "./types";

export class ProtocolLoader {
  private static loadPromise: Promise<void> | null = null;

  /**
   * Load all core protocols
   */
  static async loadCore(): Promise<void> {
    if (ProtocolLoader.loadPromise) {
      return ProtocolLoader.loadPromise;
    }

    if (protocolRegistry.isInitialized()) {
      return;
    }

    ProtocolLoader.loadPromise = ProtocolLoader.performLoad();
    return ProtocolLoader.loadPromise;
  }

  private static async performLoad(): Promise<void> {
    try {
      logger.info("Loading core protocols...");

      // Dynamic import for code splitting
      const {
        ThalaProtocol,
        AriesProtocol,
        LiquidSwapProtocol,
        PancakeSwapProtocol,
        AmnisProtocol,
        ThalaLSDProtocol,
        SushiSwapProtocol,
        CellanaProtocol,
        MerkleProtocol,
      } = await import("./definitions");

      // Register core protocols
      const coreProtocols = [
        // DEX Protocols
        ThalaProtocol,
        LiquidSwapProtocol,
        PancakeSwapProtocol,
        SushiSwapProtocol,
        CellanaProtocol,

        // Lending Protocols
        AriesProtocol,

        // Liquid Staking Protocols
        AmnisProtocol,
        ThalaLSDProtocol,

        // Derivatives Protocols
        MerkleProtocol,
      ];

      protocolRegistry.registerBulk(coreProtocols);
      protocolRegistry.setInitialized();

      logger.info(`Loaded ${coreProtocols.length} core protocols`);
    } catch (error) {
      logger.error("Failed to load core protocols", error);
      throw error;
    } finally {
      ProtocolLoader.loadPromise = null;
    }
  }

  /**
   * Load a specific protocol definition
   */
  static async loadProtocol(id: string): Promise<ProtocolDefinition | null> {
    try {
      // Check if already loaded
      const existing = protocolRegistry.get(id);
      if (existing) {
        return existing;
      }

      // Try dynamic import
      const module = await import(`./definitions/${id}.ts`);
      const protocolKey = `${id.charAt(0).toUpperCase()}${id.slice(1)}Protocol`;
      const protocol = module[protocolKey];

      if (protocol) {
        protocolRegistry.register(protocol);
        return protocol;
      }

      return null;
    } catch (error) {
      logger.debug(`Protocol ${id} not found or failed to load`, error);
      return null;
    }
  }

  /**
   * Load protocols by type
   */
  static async loadByType(type: string): Promise<ProtocolDefinition[]> {
    // Ensure core protocols are loaded
    await ProtocolLoader.loadCore();

    // Could implement lazy loading of additional protocols by type
    // For now, return what's registered
    return protocolRegistry.getByType(type as any);
  }

  /**
   * Load all available protocols
   */
  static async loadAll(): Promise<void> {
    await ProtocolLoader.loadCore();

    // Could scan definitions directory and load all
    // For now, core protocols are sufficient
  }

  /**
   * Reload protocols (useful for development)
   */
  static async reload(): Promise<void> {
    protocolRegistry.clear();
    ProtocolLoader.loadPromise = null;
    await ProtocolLoader.loadCore();
  }
}
