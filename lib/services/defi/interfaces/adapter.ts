import {
  DeFiPosition,
  AdapterConfig,
  AdapterMetrics,
  PositionScanResult,
} from '../types';

export interface ProtocolAdapter {
  readonly id: string;
  readonly name: string;
  readonly protocolName: string;
  readonly version: string;
  readonly supportedProtocols: string[];

  config: AdapterConfig;
  metrics: AdapterMetrics;

  initialize(config: AdapterConfig): Promise<void>;

  scanPositions(walletAddress: string): Promise<PositionScanResult>;

  isSupported(protocolAddress: string): boolean;

  validateWalletAddress(address: string): boolean;

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: string;
    issues?: string[];
  };

  setContext(context: AdapterContext): void;

  cleanup?(): Promise<void>;
}

export interface ProtocolAdapterConstructor {
  new (config?: Partial<AdapterConfig>): ProtocolAdapter;
}

export interface AdapterContext {
  walletAddress: string;
  indexerUrl: string;
  apiKey?: string;
  priceService?: PriceService;
  cacheService?: CacheService;
  logger?: Logger;
}

export interface PriceService {
  getTokenPrice(tokenAddress: string): Promise<number | null>;
  getTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
}

export interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
  debug(message: string, data?: any): void;
}
