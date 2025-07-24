// Core exports
export { DeFiPositionProvider } from './DeFiPositionProvider';
export {
  DeFiProviderFactory,
  createDeFiProvider,
} from './factory/DeFiProviderFactory';

// Base classes
export { BaseProtocolAdapter } from './base/BaseProtocolAdapter';

// Interfaces
export type {
  ProtocolAdapter,
  AdapterContext,
  Logger,
  PriceService,
  CacheService,
} from './interfaces/adapter';
export type {
  DeFiPositionProvider as IDeFiPositionProvider,
  ScanOptions,
  ProviderHealthStatus,
  PositionAggregator as IPositionAggregator,
  AdapterRegistry as IAdapterRegistry,
} from './interfaces/provider';

// Types
export type {
  DeFiPosition,
  DeFiAsset,
  AdapterConfig,
  AdapterMetrics,
  PositionScanResult,
  AggregatedPositions,
} from './types';
export { ProtocolType, PositionType, AssetType } from './types';

// Adapters
export { ThalaAdapter } from './adapters/ThalaAdapter';
export { GenericTokenAdapter } from './adapters/GenericTokenAdapter';

// Registry and aggregation
export { AdapterRegistry } from './registry/AdapterRegistry';
export { PositionAggregator } from './aggregation/PositionAggregator';

// Re-export factory config type
export type { DeFiProviderConfig } from './factory/DeFiProviderFactory';
