/**
 * Service to sync protocol data with DeFi Llama
 * Updates protocol TVL, volume, and fees with live data
 */

import { defiLlamaService, type DeFiLlamaProtocol } from './defi-llama';
import { formatCurrency } from '@/lib/utils';
import { serviceLogger } from '@/lib/utils/logger';

// Protocol mapping between local names and DeFi Llama slugs
const PROTOCOL_MAPPING: Record<string, string> = {
  LiquidSwap: 'liquidswap',
  PancakeSwap: 'pancakeswap-aptos',
  SushiSwap: 'sushiswap',
  Cellana: 'cellana',
  Merkle: 'merkle-trade',
  Thala: 'thala',
  Aries: 'aries-markets',
  Echelon: 'echelon',
  Movement: 'movement-labs',
};

export interface ProtocolUpdate {
  title: string;
  tvl?: string;
  defiLlamaTvl?: string;
  volume24h?: string;
  fees24h?: string;
  change24h?: number;
  lastUpdated: string;
}

class DeFiProtocolSyncService {
  private cache = new Map<
    string,
    { data: ProtocolUpdate; timestamp: number }
  >();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private getCached(protocol: string): ProtocolUpdate | null {
    const cached = this.cache.get(protocol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(protocol: string, data: ProtocolUpdate): void {
    this.cache.set(protocol, { data, timestamp: Date.now() });
  }

  /**
   * Get updated protocol data from DeFi Llama
   */
  async getProtocolUpdate(
    protocolTitle: string
  ): Promise<ProtocolUpdate | null> {
    const cached = this.getCached(protocolTitle);
    if (cached) return cached;

    try {
      const defiLlamaSlug = PROTOCOL_MAPPING[protocolTitle];
      if (!defiLlamaSlug) {
        serviceLogger.warn(
          `No DeFi Llama mapping found for protocol: ${protocolTitle}`
        );
        return null;
      }

      const protocols = await defiLlamaService.getAptosProtocols();
      const protocolData = protocols.find(
        p =>
          p.slug === defiLlamaSlug ||
          p.name.toLowerCase() === protocolTitle.toLowerCase()
      );

      if (!protocolData) {
        serviceLogger.warn(`Protocol ${protocolTitle} not found in DeFi Llama data`);
        return null;
      }

      const update: ProtocolUpdate = {
        title: protocolTitle,
        tvl: formatCurrency(protocolData.tvl, 'USD', { compact: true }),
        defiLlamaTvl: protocolData.tvl.toString(),
        change24h: protocolData.change_1d,
        lastUpdated: new Date().toISOString(),
      };

      this.setCache(protocolTitle, update);
      return update;
    } catch (error) {
      serviceLogger.error(
        `Error fetching protocol update for ${protocolTitle}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get updates for multiple protocols
   */
  async getMultipleProtocolUpdates(
    protocolTitles: string[]
  ): Promise<Record<string, ProtocolUpdate | null>> {
    const updates: Record<string, ProtocolUpdate | null> = {};

    // Process in parallel but respect rate limits
    const batchSize = 3;
    for (let i = 0; i < protocolTitles.length; i += batchSize) {
      const batch = protocolTitles.slice(i, i + batchSize);
      const batchPromises = batch.map(title => this.getProtocolUpdate(title));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const title = batch[index];
        updates[title] = result.status === 'fulfilled' ? result.value : null;
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < protocolTitles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return updates;
  }

  /**
   * Check if a protocol is tracked by DeFi Llama
   */
  isProtocolTracked(protocolTitle: string): boolean {
    return protocolTitle in PROTOCOL_MAPPING;
  }

  /**
   * Get all tracked protocol names
   */
  getTrackedProtocols(): string[] {
    return Object.keys(PROTOCOL_MAPPING);
  }

  /**
   * Add or update protocol mapping
   */
  addProtocolMapping(localName: string, defiLlamaSlug: string): void {
    PROTOCOL_MAPPING[localName] = defiLlamaSlug;
  }
}

export const defiProtocolSyncService = new DeFiProtocolSyncService();
