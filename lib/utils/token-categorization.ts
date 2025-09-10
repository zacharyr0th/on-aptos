import { PANORA_TOKENS } from "@/lib/config/data";
import { LST_TOKEN_ADDRESSES } from "@/lib/constants/tokens/lst";
import { ALL_STABLECOINS, LEGITIMATE_STABLECOINS } from "@/lib/constants/tokens/stablecoins";

export type TokenCategory = "Stablecoins" | "LSTs" | "DeFi" | "Other";

interface CategorizedToken {
  category: TokenCategory;
  symbol: string;
  value: number;
  percentage: number;
  assetType: string;
}

interface CategoryAllocation {
  category: TokenCategory;
  value: number;
  percentage: number;
  color: string;
}

const CATEGORY_COLORS: Record<TokenCategory, string> = {
  Stablecoins: "#22c55e", // Green
  LSTs: "#8b5cf6", // Purple
  DeFi: "#3b82f6", // Blue
  Other: "#6b7280", // Gray
};

// Check if an asset is a stablecoin
function isStablecoin(assetType: string): boolean {
  // Check against the unified stablecoin registry
  return LEGITIMATE_STABLECOINS.has(assetType);
}

// Check if an asset is an LST
function isLST(assetType: string): boolean {
  // Check if it's in the LST addresses object
  for (const provider of Object.values(LST_TOKEN_ADDRESSES)) {
    for (const token of Object.values(provider)) {
      if (("coin" in token && token.coin === assetType) || token.fa === assetType) {
        return true;
      }
    }
  }

  // Also check the token objects
  for (const token of Object.values(PANORA_TOKENS)) {
    if (token.asset_type === assetType) return true;
  }

  return false;
}

// Categorize a single token
export function categorizeToken(assetType: string, symbol?: string): TokenCategory {
  // Check if it's explicitly marked as DeFi
  if (assetType === "DeFi Positions" || symbol === "DEFI") {
    return "DeFi";
  }

  // Check stablecoins
  if (isStablecoin(assetType)) {
    return "Stablecoins";
  }

  // Check LSTs
  if (isLST(assetType)) {
    return "LSTs";
  }

  // Default to Other
  return "Other";
}

// Process allocation data to get categories and top tokens
export function processAllocationData(
  allocationData: Array<{
    assetType: string;
    symbol: string;
    value: number;
    percentage: number;
  }>
): {
  categories: CategoryAllocation[];
  topTokens: CategorizedToken[];
} {
  // Group by category
  const categoryMap = new Map<TokenCategory, number>();
  const categorizedTokens: CategorizedToken[] = [];

  allocationData.forEach((asset) => {
    const category = categorizeToken(asset.assetType, asset.symbol);
    const currentValue = categoryMap.get(category) || 0;
    categoryMap.set(category, currentValue + asset.value);

    categorizedTokens.push({
      category,
      symbol: asset.symbol,
      value: asset.value,
      percentage: asset.percentage,
      assetType: asset.assetType,
    });
  });

  // Calculate total value
  const totalValue = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

  // Convert to category allocations
  const categories: CategoryAllocation[] = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: CATEGORY_COLORS[category],
    }))
    .sort((a, b) => b.value - a.value);

  // Get top 3 tokens by value
  const topTokens = categorizedTokens.sort((a, b) => b.value - a.value).slice(0, 3);

  return { categories, topTokens };
}
