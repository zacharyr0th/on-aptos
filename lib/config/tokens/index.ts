// Common token interface definitions
export interface Token {
  symbol: string;
  supply: string;
  supply_raw?: string;
  formatted_supply?: string;
}

export interface CombinedToken {
  symbol: string;
  supply: string;
  supply_raw?: string;
  isCombined: true;
  components: Token[];
}

export type DisplayToken = Token | CombinedToken;

export interface SupplyData {
  supplies: Token[];
  total: string;
  total_formatted?: string;
  timestamp?: string;
}

// Re-export all token configurations
export * from "./stablecoins";
export * from "./btc";
export * from "./lst";
