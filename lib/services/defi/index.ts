// Ultra-simple DeFi scanner - just one function!
export { scanDeFiPositions, type DeFiPosition } from "./scanner";

// For backwards compatibility, export a simple wrapper
export async function createDeFiProvider() {
  const { scanDeFiPositions } = await import("./scanner");
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
