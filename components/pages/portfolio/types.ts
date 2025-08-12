// Re-export types from the main portfolio service types
export type { NFT, FungibleAsset, DeFiPosition } from "@/lib/services/portfolio/types";

// Portfolio-specific types
export type SortField = "timestamp" | "type" | "amount" | "asset";
export type SortDirection = "asc" | "desc";
