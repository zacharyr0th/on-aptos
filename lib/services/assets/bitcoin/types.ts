/**
 * Bitcoin Domain Types
 */

export interface BTCMarket {
  symbol: string;
  marketAddress: string;
  assetType: string;
  description: string;
  balance: string;
  rawBalance: string;
  decimals: number;
  apyBase: number;
  apyReward: number;
  apyBaseBorrow: number;
  totalSupply: number;
  totalBorrow: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  tvlUsd: number;
  price: number;
}

export interface BTCSupplyToken {
  symbol: string;
  supply: string;
  formatted_supply: string;
}

export interface BTCData {
  protocol: string;
  markets: BTCMarket[];
  total: {
    btc: string;
    normalized: string;
    tvlUsd: number;
  };
}

export interface ComprehensiveBTCSupply {
  supplies: BTCSupplyToken[];
  total: string;
  total_formatted: string;
  total_decimals: number;
}

// Echelon API types
export interface EchelonReward {
  rewardKey: string;
  allocPoint: number;
}

export interface EchelonPool {
  stakeAmount: number;
  rewards: EchelonReward[];
}

export interface EchelonRewardData {
  rewardPerSec: number;
  totalAllocPoint: number;
  startTime: number;
  endTime: number;
  rewardCoin: {
    price: number;
    address?: string;
    symbol?: string;
  };
}

export interface EchelonFarmingData {
  rewards: [string, EchelonRewardData][];
  pools: {
    supply: [string, EchelonPool][];
    borrow: [string, EchelonPool][];
  };
}

export interface EchelonCoinInfo {
  price: number;
  symbol: string;
  address?: string;
}

export interface EchelonMarketStats {
  totalCash?: string;
  totalLiability?: string;
  totalReserve?: string;
}

export interface EchelonAsset {
  address: string;
  market: string;
  faAddress?: string;
  symbol: string;
  price: number;
  decimals?: number;
  supplyApr?: number;
  borrowApr?: number;
  stakingApr?: number;
}

export interface EchelonApiResponse {
  data: {
    assets: EchelonAsset[];
    marketStats: [string, EchelonMarketStats][];
    farming?: EchelonFarmingData;
  };
}

export interface FarmingAprResult {
  coin: {
    price: number;
    address?: string;
    symbol?: string;
  };
  apr: number;
}