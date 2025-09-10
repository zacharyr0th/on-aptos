// Main DeFi scanner and types

// Fungible Asset Service
export { FungibleAssetService } from "./fungible-asset-service";
export * from "./services/defi-balance-service";

// Services
export * from "./services/defi-service";
export * from "./services/position-builders";
export * from "./services/protocol-scanners";
// Service modules (newly split)
export * from "./services/types";
export * from "./services/utils";
// Shared utilities and converters
export * from "./shared";
export {
  type DeFiPosition,
  type ScanResult,
  scanDeFiPositions,
  UnifiedDeFiScanner,
  unifiedScanner,
} from "./unified-scanner";

// Legacy compatibility wrapper
export async function createDeFiProvider() {
  const { scanDeFiPositions } = await import("./unified-scanner");
  return {
    scanPositions: scanDeFiPositions,
    initializeAllAdapters: async () => {}, // No-op for compatibility
  };
}

// Backward compatibility alias
export const DeFiPositionProvider = createDeFiProvider;
