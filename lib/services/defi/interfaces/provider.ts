import { DeFiPosition, AggregatedPositions, AdapterConfig } from '../types';
import { ProtocolAdapter } from './adapter';

export interface DeFiPositionProvider {
  scanPositions(
    walletAddress: string,
    options?: ScanOptions
  ): Promise<AggregatedPositions>;

  registerAdapter(adapter: ProtocolAdapter): void;

  unregisterAdapter(adapterId: string): void;

  getRegisteredAdapters(): ProtocolAdapter[];

  getAdapterById(adapterId: string): ProtocolAdapter | undefined;

  updateAdapterConfig(adapterId: string, config: Partial<AdapterConfig>): void;

  getProviderHealth(): ProviderHealthStatus;
}

export interface ScanOptions {
  adapters?: string[];
  parallel?: boolean;
  timeout?: number;
  includeDust?: boolean;
  minValueUSD?: number;
  skipCache?: boolean;
  includeInactive?: boolean;
}

export interface ProviderHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  adapters: Array<{
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastScan?: string;
    issues?: string[];
  }>;
  lastFullScan?: string;
  totalActiveAdapters: number;
}

export interface PositionAggregator {
  aggregate(
    results: Array<{ adapterId: string; positions: DeFiPosition[] }>
  ): AggregatedPositions;

  deduplicate(positions: DeFiPosition[]): DeFiPosition[];

  calculateSummary(positions: DeFiPosition[]): AggregatedPositions['summary'];
}

export interface AdapterRegistry {
  register(adapter: ProtocolAdapter): void;

  unregister(adapterId: string): void;

  getAll(): ProtocolAdapter[];

  getById(adapterId: string): ProtocolAdapter | undefined;

  getByProtocol(protocolName: string): ProtocolAdapter[];

  getEnabled(): ProtocolAdapter[];

  updateConfig(adapterId: string, config: Partial<AdapterConfig>): void;
}
