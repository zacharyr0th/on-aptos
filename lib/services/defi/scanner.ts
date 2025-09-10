/**
 * DeFi Scanner - Uses new modular protocol system
 * Re-exports from unified-scanner.ts for backward compatibility
 */

export type { DeFiPosition, ScanResult } from "./unified-scanner";
export {
  scanDeFiPositions,
  UnifiedDeFiScanner,
  unifiedScanner,
  unifiedScanner as default,
} from "./unified-scanner";
