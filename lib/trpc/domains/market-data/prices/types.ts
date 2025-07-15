/**
 * Price Domain Types
 */

export interface CMCPriceData {
  symbol: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  price: number;
  marketCap?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  volume24h?: number;
  percentChange1h?: number;
  percentChange24h?: number;
  percentChange7d?: number;
  percentChange30d?: number;
  percentChange60d?: number;
  percentChange90d?: number;
  fullyDilutedMarketCap?: number;
  lastUpdated?: string;
  updated?: string;
}

export interface PanoraPriceItem {
  symbol: string;
  name: string;
  asset_type: string;
  price: string;
  decimals: number;
}

export interface PanoraPricesData {
  success: boolean;
  prices: PanoraPriceItem[];
  attribution: string;
}

export interface PriceServiceConfig {
  timeout: number;
  retries: number;
  cacheTTL: number;
}

// CMC symbol ID mapping
export const CMC_SYMBOL_IDS: Record<string, string> = {
  susde: '29471',
  btc: '1',
  apt: '21794', // Aptos
  // Add more mappings as needed
};

// CoinGecko coin ID mapping for historical prices
export const COINGECKO_IDS: Record<string, string> = {
  apt: 'aptos',
  usdc: 'usd-coin',
  usdt: 'tether',
  btc: 'bitcoin',
  eth: 'ethereum',
  // Add more mappings as needed
};

// Symbol display names
export const SYMBOL_DISPLAY_NAMES: Record<string, string> = {
  susde: 'sUSDe',
  btc: 'BTC',
  apt: 'APT',
};

// Full names
export const SYMBOL_FULL_NAMES: Record<string, string> = {
  susde: 'Ethena Staked USDe',
  btc: 'Bitcoin',
  apt: 'Aptos',
};
