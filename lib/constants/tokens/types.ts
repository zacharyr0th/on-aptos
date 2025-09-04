/**
 * Unified token type definitions
 * Central source of truth for all token-related types
 */

export interface TokenDefinition {
  address: string;
  faAddress?: string; // For tokens that support both coin and FA standards
  symbol: string;
  name: string;
  decimals: number;
  type: "native" | "bridged" | "lst" | "stablecoin" | "rwa" | "protocol";
  bridge?: "layerzero" | "wormhole" | "celer";
  verified?: boolean;
}

export interface BridgeTokenDefinition extends TokenDefinition {
  type: "bridged";
  bridge: "layerzero" | "wormhole" | "celer";
  originalChain: string;
}

export interface LSTokenDefinition extends TokenDefinition {
  type: "lst";
  protocol: string;
  underlyingAsset: string;
}

export interface StablecoinDefinition extends TokenDefinition {
  type: "stablecoin";
  peggedTo: "USD" | "EUR" | "OTHER";
  algorithmic?: boolean;
}

export interface RWATokenDefinition extends TokenDefinition {
  type: "rwa";
  assetClass: string;
  protocol: string;
  regulatoryFramework?: string;
  issuer: string;
}

export type AnyTokenDefinition =
  | TokenDefinition
  | BridgeTokenDefinition
  | LSTokenDefinition
  | StablecoinDefinition
  | RWATokenDefinition;

/**
 * Token registry lookup maps
 */
export interface TokenRegistry {
  byAddress: Map<string, AnyTokenDefinition>;
  bySymbol: Map<string, AnyTokenDefinition | AnyTokenDefinition[]>;
  byType: Map<TokenDefinition["type"], AnyTokenDefinition[]>;
}
