import { z } from 'zod';
import { BaseResponseSchema } from '../../../shared/schemas/base';

/**
 * Raw protocol data from DeFiLlama API
 */
export interface RawProtocolData {
  id: string;
  name: string;
  symbol?: string;
  category?: string;
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
  chains?: string[];
  chain?: string;
}

/**
 * Transformed protocol data returned by our API
 */
export interface TransformedProtocolData {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  tvl: number;
  change_1d?: number;
  change_7d?: number;
}

/**
 * TVL historical data from DeFiLlama
 */
export interface TvlHistoricalEntry {
  date: string;
  tvl: number;
}

/**
 * Volume data from DeFiLlama
 */
export interface VolumeData {
  total24h?: number;
  totalVolume24h?: number;
}

/**
 * Protocols response schema
 */
export interface ProtocolsResponse {
  protocols: TransformedProtocolData[];
}

/**
 * Fees data interface
 */
export interface FeesData {
  total24h?: number;
  totalAllTime?: number;
  breakdown24h?: Record<string, number>;
}

/**
 * Revenue data interface
 */
export interface RevenueData {
  total24h?: number;
  totalAllTime?: number;
  breakdown24h?: Record<string, number>;
}

/**
 * All metrics response schema
 */
export interface AllMetricsResponse {
  tvl: number;
  spotVolume: number;
  derivativesVolume: number;
  protocolCount: number;
  protocols: TransformedProtocolData[];
  fees: FeesData;
  revenue: RevenueData;
}

/**
 * Protocol metrics type definition
 */
export type ProtocolMetrics = {
  tvl?: number;
  volume24h?: number;
  volumes?: {
    spot?: number;
    derivatives?: number;
  };
};

/**
 * Protocol names input schema
 */
export const ProtocolNamesInputSchema = z.array(z.string());
