import { ProtocolAdapter, AdapterContext, Logger } from '../interfaces/adapter';
import { LPTokenPriceService } from '../services/LPTokenPriceService';
import {
  DeFiPosition,
  AdapterConfig,
  AdapterMetrics,
  PositionScanResult,
  ProtocolType,
} from '../types';

export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly protocolName: string;
  abstract readonly version: string;
  abstract readonly supportedProtocols: string[];

  public config: AdapterConfig;
  public metrics: AdapterMetrics;

  protected context?: AdapterContext;
  protected logger?: Logger;
  protected initialized = false;
  protected lpPriceService?: LPTokenPriceService;

  constructor(config?: Partial<AdapterConfig>) {
    this.config = this.getDefaultConfig(config);
    this.metrics = this.initializeMetrics();
  }

  protected getDefaultConfig(override?: Partial<AdapterConfig>): AdapterConfig {
    return {
      enabled: true,
      priority: 50,
      timeout: 30000,
      retryAttempts: 3,
      cacheTimeToLive: 300000, // 5 minutes
      features: {
        priceCalculation: true,
        rewardTracking: false,
        historicalData: false,
      },
      ...override,
    };
  }

  protected initializeMetrics(): AdapterMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }

  async initialize(config: AdapterConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.onInitialize();
    this.initialized = true;
  }

  async scanPositions(walletAddress: string): Promise<PositionScanResult> {
    if (!this.initialized) {
      throw new Error(`Adapter ${this.id} not initialized`);
    }

    if (!this.config.enabled) {
      return {
        positions: [],
        metadata: {
          adapterId: this.id,
          walletAddress,
          scanDuration: 0,
          timestamp: new Date().toISOString(),
          positionsFound: 0,
          totalValueUSD: 0,
        },
      };
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      this.logger?.debug(`Starting position scan for ${walletAddress}`, {
        adapterId: this.id,
      });

      const positions = await this.executeWithTimeout(
        () => this.scanProtocolPositions(walletAddress),
        this.config.timeout
      );

      const scanDuration = Date.now() - startTime;
      const totalValueUSD = positions.reduce(
        (sum, pos) => sum + pos.totalValueUSD,
        0
      );

      this.updateMetrics(scanDuration, true);

      this.logger?.info(`Scan completed successfully`, {
        adapterId: this.id,
        walletAddress,
        positionsFound: positions.length,
        totalValueUSD,
        scanDuration,
      });

      return {
        positions,
        metadata: {
          adapterId: this.id,
          walletAddress,
          scanDuration,
          timestamp: new Date().toISOString(),
          positionsFound: positions.length,
          totalValueUSD,
        },
      };
    } catch (error) {
      const scanDuration = Date.now() - startTime;
      this.updateMetrics(scanDuration, false);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.metrics.lastError = errorMessage;

      this.logger?.error(`Scan failed for ${walletAddress}`, {
        adapterId: this.id,
        error: errorMessage,
        scanDuration,
      });

      throw error;
    }
  }

  isSupported(protocolAddress: string): boolean {
    return this.supportedProtocols.some(protocol =>
      protocolAddress.toLowerCase().includes(protocol.toLowerCase())
    );
  }

  validateWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }

  getHealthStatus() {
    const recentFailureRate =
      this.metrics.totalRequests > 0
        ? this.metrics.failedRequests / this.metrics.totalRequests
        : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];

    if (!this.config.enabled) {
      status = 'unhealthy';
      issues.push('Adapter is disabled');
    } else if (recentFailureRate > 0.5) {
      status = 'unhealthy';
      issues.push(
        `High failure rate: ${(recentFailureRate * 100).toFixed(1)}%`
      );
    } else if (recentFailureRate > 0.2) {
      status = 'degraded';
      issues.push(
        `Elevated failure rate: ${(recentFailureRate * 100).toFixed(1)}%`
      );
    }

    if (this.metrics.averageResponseTime > 10000) {
      status = status === 'healthy' ? 'degraded' : status;
      issues.push(`Slow response time: ${this.metrics.averageResponseTime}ms`);
    }

    return {
      status,
      lastCheck: new Date().toISOString(),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  protected abstract onInitialize(): Promise<void>;

  protected abstract scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]>;

  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  protected updateMetrics(duration: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time using exponential moving average
    const alpha = 0.1;
    this.metrics.averageResponseTime =
      this.metrics.averageResponseTime * (1 - alpha) + duration * alpha;

    this.metrics.lastExecutionTime = new Date().toISOString();
  }

  protected createPositionId(
    protocol: string,
    positionType: string,
    address: string
  ): string {
    return `${protocol}-${positionType}-${address}`.toLowerCase();
  }

  protected async getTokenPrice(tokenAddress: string): Promise<number> {
    if (
      !this.context?.priceService ||
      !this.config.features?.priceCalculation
    ) {
      return 0;
    }

    try {
      return (await this.context.priceService.getTokenPrice(tokenAddress)) || 0;
    } catch (error) {
      this.logger?.warn(`Failed to get price for token ${tokenAddress}`, error);
      return 0;
    }
  }

  protected async getTokenPrices(
    tokenAddresses: string[]
  ): Promise<Map<string, number>> {
    if (
      !this.context?.priceService ||
      !this.config.features?.priceCalculation
    ) {
      return new Map();
    }

    try {
      return await this.context.priceService.getTokenPrices(tokenAddresses);
    } catch (error) {
      this.logger?.warn(`Failed to get prices for tokens`, error);
      return new Map();
    }
  }

  setContext(context: AdapterContext): void {
    this.context = context;
    this.logger = context.logger;
    if (context.priceService) {
      this.lpPriceService = new LPTokenPriceService(context.priceService);
    }
  }

  protected async calculateLPTokenPrice(
    lpTokenType: string,
    lpAmount: number
  ): Promise<number> {
    if (!this.lpPriceService) {
      return 0;
    }

    // Try to parse LP token type to get underlying tokens
    const tokenPair = this.lpPriceService.parseLPTokenType(lpTokenType);
    if (!tokenPair) {
      return 0;
    }

    // For now, use estimation method
    // In production, you'd want to fetch actual pool reserves
    return this.lpPriceService.estimateLPTokenPrice(
      tokenPair.token0,
      tokenPair.token1,
      lpAmount
    );
  }

  async cleanup?(): Promise<void> {
    // Default implementation - can be overridden
  }
}
