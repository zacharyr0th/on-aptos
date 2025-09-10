// Pure functions for portfolio calculations

export interface Asset {
  asset_type: string;
  value?: number;
  metadata?: {
    symbol?: string;
    name?: string;
  };
}

export interface DeFiGroup {
  protocol: string;
  positions: any[];
  totalValue: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

/**
 * Filter assets based on visibility rules
 */
export function filterVisibleAssets(
  assets: Asset[],
  hideFiltered: boolean = true,
  minValue: number = 0.01
): Asset[] {
  if (!assets) return [];
  if (!hideFiltered) return assets;

  return assets.filter((asset) => {
    // Always show APT
    if (asset.asset_type === "0x1::aptos_coin::AptosCoin") return true;

    // Filter out CELL tokens
    if (
      asset.metadata?.symbol === "CELL" ||
      asset.asset_type === "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"
    ) {
      return false;
    }

    // Filter by minimum value
    return (asset.value || 0) >= minValue;
  });
}

/**
 * Group DeFi positions by protocol
 */
export function groupDeFiByProtocol(positions: any[]): DeFiGroup[] {
  if (!positions || !Array.isArray(positions)) return [];

  const grouped = positions.reduce(
    (acc, position) => {
      const protocol = position.protocol;
      if (!acc[protocol]) {
        acc[protocol] = {
          protocol,
          positions: [],
          totalValue: 0,
        };
      }
      acc[protocol].positions.push(position);
      acc[protocol].totalValue +=
        position.totalValueUSD || position.totalValue || position.tvl_usd || 0;
      return acc;
    },
    {} as Record<string, DeFiGroup>
  );

  const groups = Object.values(grouped) as DeFiGroup[];
  return groups.sort((a, b) => b.totalValue - a.totalValue);
}

/**
 * Calculate total portfolio value
 */
export function calculateTotalValue(assets: Asset[], defiGroups: DeFiGroup[]): number {
  const assetsValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const defiValue = defiGroups.reduce((sum, group) => sum + group.totalValue, 0);
  return assetsValue + defiValue;
}

/**
 * Generate pie chart data from portfolio
 */
export function generatePieChartData(
  assets: Asset[],
  defiGroups: DeFiGroup[],
  minPercentage: number = 0.5
): ChartDataPoint[] {
  const totalValue = calculateTotalValue(assets, defiGroups);
  if (totalValue === 0) return [];

  const data: ChartDataPoint[] = [];

  // Add assets
  assets
    .filter((asset) => (asset.value || 0) > 0)
    .forEach((asset) => {
      const percentage = ((asset.value || 0) / totalValue) * 100;
      data.push({
        name: asset.metadata?.symbol || "Unknown",
        value: asset.value || 0,
        percentage,
      });
    });

  // Add DeFi positions
  defiGroups.forEach((group) => {
    const percentage = (group.totalValue / totalValue) * 100;
    data.push({
      name: group.protocol,
      value: group.totalValue,
      percentage,
    });
  });

  // Sort by value and group small items
  data.sort((a, b) => b.value - a.value);

  // Group items below threshold
  const threshold = totalValue * (minPercentage / 100);
  const mainItems: ChartDataPoint[] = [];
  let othersValue = 0;

  data.forEach((item) => {
    if (item.value >= threshold) {
      mainItems.push(item);
    } else {
      othersValue += item.value;
    }
  });

  if (othersValue > 0) {
    mainItems.push({
      name: "Others",
      value: othersValue,
      percentage: (othersValue / totalValue) * 100,
    });
  }

  return mainItems;
}

/**
 * Calculate 24h change metrics
 */
export function calculate24hChange(
  currentValue: number,
  history: Array<{ timestamp: number; value: number }>
): { change: number; percentage: number } {
  if (!history || history.length === 0) {
    return { change: 0, percentage: 0 };
  }

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  // Find value closest to 24h ago
  const dayAgoValue =
    history
      .filter((point) => point.timestamp >= dayAgo)
      .sort((a, b) => a.timestamp - b.timestamp)[0]?.value ||
    history[0]?.value ||
    0;

  const change = currentValue - dayAgoValue;
  const percentage = dayAgoValue > 0 ? (change / dayAgoValue) * 100 : 0;

  return { change, percentage };
}

/**
 * Sort DeFi positions
 */
export function sortDeFiPositions(
  groups: DeFiGroup[],
  sortBy: "protocol" | "value" | "type",
  order: "asc" | "desc"
): DeFiGroup[] {
  const sorted = [...groups].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "protocol":
        comparison = a.protocol.localeCompare(b.protocol);
        break;
      case "value":
        comparison = a.totalValue - b.totalValue;
        break;
      case "type": {
        // Sort by protocol type if available
        const typeA = a.positions[0]?.protocol_type || "";
        const typeB = b.positions[0]?.protocol_type || "";
        comparison = typeA.localeCompare(typeB);
        break;
      }
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Calculate APY from DeFi positions
 */
export function calculateTotalAPY(defiGroups: DeFiGroup[]): number {
  let totalWeightedAPY = 0;
  let totalValue = 0;

  defiGroups.forEach((group) => {
    group.positions.forEach((position) => {
      const apy = position.apy || position.apr || 0;
      const value = position.totalValueUSD || position.tvl_usd || 0;
      totalWeightedAPY += apy * value;
      totalValue += value;
    });
  });

  return totalValue > 0 ? totalWeightedAPY / totalValue : 0;
}

/**
 * Format address for display
 */
export function formatAddress(address: string, length: number = 6): string {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Validate Aptos address format
 */
export function isValidAptosAddress(address: string): boolean {
  const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
  return /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);
}

/**
 * Normalize address to standard format
 */
export function normalizeAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;
  return !address.startsWith("0x") ? `0x${address}` : address;
}
