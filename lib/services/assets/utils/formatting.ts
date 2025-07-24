import { DECIMALS } from '../constants';

export function formatTokenAmount(
  amount: string | number,
  decimals: number = DECIMALS.DEFAULT
): number {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return value / Math.pow(10, decimals);
}

export function convertRawTokenAmount(
  rawAmount: string | number,
  decimals: number = DECIMALS.DEFAULT
): { display: string; numeric: number } {
  const numeric = formatTokenAmount(rawAmount, decimals);
  const display = formatNumberWithCommas(numeric);
  return { display, numeric };
}

export function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

export function normalizeTokenSymbol(symbol: string): string {
  // Handle common variations
  const symbolMap: Record<string, string> = {
    'WRAPPED-BTC': 'wBTC',
    'WRAPPED BTC': 'wBTC',
    WBTC: 'wBTC',
    'CELAR-WBTC': 'ceWBTC',
    ZBTC: 'zBTC',
    'Z-BTC': 'zBTC',
    AMAPT: 'amAPT',
    'AM-APT': 'amAPT',
    STAPT: 'stAPT',
    'ST-APT': 'stAPT',
    THAPT: 'thAPT',
    'TH-APT': 'thAPT',
  };

  const upperSymbol = symbol.toUpperCase();
  return symbolMap[upperSymbol] || symbol;
}

export function getTokenIcon(symbol: string, iconUri?: string): string {
  if (iconUri) return iconUri;

  // Fallback to placeholder based on symbol
  const iconMap: Record<string, string> = {
    BTC: '/icons/btc.svg',
    wBTC: '/icons/wbtc.svg',
    APT: '/icons/apt.svg',
    USDC: '/icons/usdc.svg',
    USDT: '/icons/usdt.svg',
  };

  return iconMap[symbol] || '/placeholder.jpg';
}

export function sortBySupply<T extends { supply: number }>(
  items: T[],
  descending = true
): T[] {
  return [...items].sort((a, b) =>
    descending ? b.supply - a.supply : a.supply - b.supply
  );
}

export function aggregateDuplicateTokens<
  T extends { symbol: string; supply: number },
>(tokens: T[]): T[] {
  const aggregated = new Map<string, T>();

  tokens.forEach(token => {
    const existing = aggregated.get(token.symbol);
    if (existing) {
      // Combine supplies
      existing.supply += token.supply;
    } else {
      aggregated.set(token.symbol, { ...token });
    }
  });

  return Array.from(aggregated.values());
}
