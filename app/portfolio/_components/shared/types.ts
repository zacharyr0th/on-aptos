// Re-export types from consolidated types
export type {
  NFT,
  FungibleAsset,
  DeFiPosition,
} from "@/lib/types/consolidated";

// Portfolio-specific types
export type SortField = "timestamp" | "type" | "amount" | "asset";
export type SortDirection = "asc" | "desc";
