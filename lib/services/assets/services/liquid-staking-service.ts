import { PANORA_TOKENS } from '@/lib/config/data';

export interface LSTData {
  token: string;
  symbol: string;
  stakingRatio: number;
  totalStaked: number;
  apy: number;
  rewards: number;
}

export class LiquidStakingService {
  static async getLSTData(): Promise<LSTData[]> {
    // Placeholder for LST data fetching
    return Object.entries(PANORA_TOKENS).map(([symbol, tokenData]) => ({
      token: tokenData.asset_type,
      symbol,
      stakingRatio: 1.0,
      totalStaked: 0,
      apy: 0,
      rewards: 0,
    }));
  }
}