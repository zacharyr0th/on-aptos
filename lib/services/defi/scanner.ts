/**
 * DeFi Scanner - Uses new modular protocol system
 * Re-exports from unified-scanner.ts for backward compatibility
 */

export {
  scanDeFiPositions,
  UnifiedDeFiScanner,
  unifiedScanner,
} from "./unified-scanner";

export type { DeFiPosition, ScanResult } from "./unified-scanner";

export { unifiedScanner as default } from "./unified-scanner";
