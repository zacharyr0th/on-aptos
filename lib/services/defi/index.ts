// Ultra-simple DeFi scanner - just one function!
import type { DeFiPosition } from "@/lib/types/consolidated";

// Temporary mock function while scanner is being fixed
export async function scanDeFiPositions( __walletAddress: string): Promise<Record<string, unknown>> {
  return {
    positions: [] as DeFiPosition[],
    totalValueUSD: 0,
    protocols: [],
    scanDuration: 0,
  };
}

export type { DeFiPosition } from "@/lib/types/consolidated";

// For backwards compatibility, export a simple wrapper
export async function createDeFiProvider() {
  return {
    scanPositions: scanDeFiPositions,
    initializeAllAdapters: async () => {}, // No-op
  };
}

// Re-export for compatibility
export const DeFiPositionProvider = createDeFiProvider;

// Export all DeFi services and utilities
export * from "./services/defi-service";
export * from "./services/defi-balance-service";
export * from "./shared";
