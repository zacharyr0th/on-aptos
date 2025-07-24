export interface PriceService {
  getTokenPrice(tokenAddress: string): Promise<number | null>;
  getTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>>;
}

export interface TokenPriceService extends PriceService {}

export interface LPPriceService {
  calculateLPTokenPrice(poolTokens: string[], totalSupply: number, reserves: number[]): Promise<number>;
  getPoolReserves(poolAddress: string): Promise<number[]>;
  getPoolTotalSupply(poolAddress: string): Promise<number>;
}