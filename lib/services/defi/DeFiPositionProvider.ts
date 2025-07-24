import { PositionAggregator } from './aggregation/PositionAggregator';
import { ProtocolAdapter, AdapterContext, Logger } from './interfaces/adapter';
import {
  DeFiPositionProvider as IDeFiPositionProvider,
  ScanOptions,
  ProviderHealthStatus,
} from './interfaces/provider';
import { AdapterRegistry } from './registry/AdapterRegistry';
import { AggregatedPositions, AdapterConfig } from './types';

export class DeFiPositionProvider implements IDeFiPositionProvider {
  private registry = new AdapterRegistry();
  private aggregator = new PositionAggregator();
  private context: AdapterContext;
  private logger?: Logger;

  constructor(context: AdapterContext) {
    this.context = context;
    this.logger = context.logger;
  }

  async scanPositions(
    walletAddress: string,
    options: ScanOptions = {}
  ): Promise<AggregatedPositions> {
    const startTime = Date.now();

    this.logger?.info('Starting DeFi position scan', {
      walletAddress,
      options,
    });

    // Validate wallet address
    if (!this.isValidWalletAddress(walletAddress)) {
      throw new Error(`Invalid wallet address: ${walletAddress}`);
    }

    // Get adapters to use
    const adapters = this.getActiveAdapters(options.adapters);

    if (adapters.length === 0) {
      this.logger?.warn('No active adapters found for scan');
      return this.createEmptyResult(walletAddress, startTime);
    }

    // Set context for all adapters
    for (const adapter of adapters) {
      adapter.setContext(this.context);
    }

    try {
      // Execute scans (parallel or sequential)
      const results =
        options.parallel !== false
          ? await this.executeConcurrentScans(adapters, walletAddress, options)
          : await this.executeSequentialScans(adapters, walletAddress, options);

      // Aggregate results
      const aggregated = this.aggregator.aggregate(results);

      // Apply filters
      if (options.minValueUSD !== undefined && options.minValueUSD > 0) {
        aggregated.positions = this.aggregator.filterByMinValue(
          aggregated.positions,
          options.minValueUSD
        );
        aggregated.summary = this.aggregator.calculateSummary(
          aggregated.positions
        );
      }

      // Update metadata
      aggregated.metadata.scanDuration = Date.now() - startTime;

      this.logger?.info('DeFi position scan completed', {
        walletAddress,
        totalPositions: aggregated.positions.length,
        totalValueUSD: aggregated.summary.totalValueUSD,
        adaptersUsed: aggregated.metadata.adaptersUsed.length,
        scanDuration: aggregated.metadata.scanDuration,
      });

      return aggregated;
    } catch (error) {
      const scanDuration = Date.now() - startTime;

      this.logger?.error('DeFi position scan failed', {
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
        scanDuration,
      });

      throw error;
    }
  }

  registerAdapter(adapter: ProtocolAdapter): void {
    this.registry.register(adapter);
    this.logger?.info(`Registered adapter: ${adapter.name} (${adapter.id})`);
  }

  unregisterAdapter(adapterId: string): void {
    const adapter = this.registry.getById(adapterId);
    this.registry.unregister(adapterId);

    if (adapter) {
      this.logger?.info(`Unregistered adapter: ${adapter.name} (${adapterId})`);
    }
  }

  getRegisteredAdapters(): ProtocolAdapter[] {
    return this.registry.getAll();
  }

  getAdapterById(adapterId: string): ProtocolAdapter | undefined {
    return this.registry.getById(adapterId);
  }

  updateAdapterConfig(adapterId: string, config: Partial<AdapterConfig>): void {
    this.registry.updateConfig(adapterId, config);
    this.logger?.info(`Updated config for adapter: ${adapterId}`, config);
  }

  getProviderHealth(): ProviderHealthStatus {
    const adapters = this.registry.getAll();
    const adapterHealths = adapters.map(adapter => {
      const health = adapter.getHealthStatus();
      return {
        id: adapter.id,
        name: adapter.name,
        status: health.status,
        lastScan: adapter.metrics.lastExecutionTime,
        issues: health.issues,
      };
    });

    const healthyCount = adapterHealths.filter(
      a => a.status === 'healthy'
    ).length;
    const degradedCount = adapterHealths.filter(
      a => a.status === 'degraded'
    ).length;
    const unhealthyCount = adapterHealths.filter(
      a => a.status === 'unhealthy'
    ).length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (unhealthyCount > adapters.length / 2) {
      overallStatus = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > adapters.length / 3) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      adapters: adapterHealths,
      totalActiveAdapters: this.registry.getEnabled().length,
      lastFullScan: undefined, // Could track this if needed
    };
  }

  private getActiveAdapters(requestedAdapterIds?: string[]): ProtocolAdapter[] {
    const allAdapters = this.registry.getSortedByPriority();

    if (requestedAdapterIds && requestedAdapterIds.length > 0) {
      return requestedAdapterIds
        .map(id => this.registry.getById(id))
        .filter(
          (adapter): adapter is ProtocolAdapter =>
            adapter !== undefined && adapter.config.enabled
        );
    }

    return allAdapters;
  }

  private async executeConcurrentScans(
    adapters: ProtocolAdapter[],
    walletAddress: string,
    options: ScanOptions
  ) {
    const promises = adapters.map(async adapter => {
      try {
        const result = await adapter.scanPositions(walletAddress);
        return {
          adapterId: adapter.id,
          positions: result.positions,
        };
      } catch (error) {
        this.logger?.error(`Adapter ${adapter.id} failed`, error);
        return {
          adapterId: adapter.id,
          positions: [],
        };
      }
    });

    return Promise.all(promises);
  }

  private async executeSequentialScans(
    adapters: ProtocolAdapter[],
    walletAddress: string,
    options: ScanOptions
  ) {
    const results = [];

    for (const adapter of adapters) {
      try {
        const result = await adapter.scanPositions(walletAddress);
        results.push({
          adapterId: adapter.id,
          positions: result.positions,
        });
      } catch (error) {
        this.logger?.error(`Adapter ${adapter.id} failed`, error);
        results.push({
          adapterId: adapter.id,
          positions: [],
        });
      }
    }

    return results;
  }

  private isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }

  private createEmptyResult(
    walletAddress: string,
    startTime: number
  ): AggregatedPositions {
    return {
      positions: [],
      summary: {
        totalPositions: 0,
        totalValueUSD: 0,
        protocolBreakdown: {},
        positionTypeBreakdown: {},
        topProtocols: [],
      },
      metadata: {
        walletAddress,
        adaptersUsed: [],
        scanDuration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Utility methods for adapter management
  async initializeAllAdapters(): Promise<void> {
    const adapters = this.registry.getAll();

    const initPromises = adapters.map(async adapter => {
      try {
        await adapter.initialize(adapter.config);
        this.logger?.info(`Initialized adapter: ${adapter.name}`);
      } catch (error) {
        this.logger?.error(
          `Failed to initialize adapter: ${adapter.name}`,
          error
        );
      }
    });

    await Promise.all(initPromises);
  }

  async cleanupAllAdapters(): Promise<void> {
    const adapters = this.registry.getAll();

    const cleanupPromises = adapters.map(async adapter => {
      try {
        if (adapter.cleanup) {
          await adapter.cleanup();
        }
        this.logger?.info(`Cleaned up adapter: ${adapter.name}`);
      } catch (error) {
        this.logger?.error(`Failed to cleanup adapter: ${adapter.name}`, error);
      }
    });

    await Promise.all(cleanupPromises);
  }

  getRegistryStats() {
    return this.registry.getStats();
  }
}
