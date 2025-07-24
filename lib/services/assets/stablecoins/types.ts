// Stablecoin service types

export interface StablecoinSupply {
  symbol: string;
  supply: string;
  supply_raw: string;
  percentage: number;
  asset_type: string;
  type: 'fungible_asset' | 'coin';
  note?: string;
}

export interface StablecoinData {
  supplies: StablecoinSupply[];
  total: string;
  total_raw: string;
  usdt_reserve: {
    amount: string;
    amount_formatted: string;
    address: string;
  };
}

export interface BridgedCoinConfig {
  symbol: string;
  name: string;
  asset_type: string;
  account: string;
  decimals: number;
}

// GraphQL response types
export interface FungibleAssetMetadata {
  asset_type: string;
  supply_v2: string;
  decimals: number;
}

export interface CurrentFungibleAssetBalance {
  amount: string;
}

export interface StablecoinGraphQLResponse {
  fungible_asset_metadata?: FungibleAssetMetadata[];
  current_fungible_asset_balances?: CurrentFungibleAssetBalance[];
}

export interface CoinBalanceResponse {
  current_coin_balances?: Array<{
    amount: string;
  }>;
}
