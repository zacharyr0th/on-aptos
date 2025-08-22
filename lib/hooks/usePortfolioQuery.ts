import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

// Types
export interface PortfolioAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
  price?: number;
  value?: number;
  balance?: number;
  isVerified?: boolean;
}

export interface NFT {
  collection_id: string;
  collection_name: string;
  token_data_id: string;
  token_name: string;
  token_uri?: string;
  cdn_asset_uris?: { cdn_image_uri?: string }[];
  current_token_data?: any;
}

export interface DeFiPosition {
  protocol: string;
  protocol_type?: string;
  position_type?: string;
  position: any;
  tvl_usd?: number;
  totalValue?: number;
  totalValueUSD?: number;
  tokens?: any[];
}

export interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  success: boolean;
  function?: string;
  gas_fee?: string;
}

export interface PortfolioData {
  assets: PortfolioAsset[];
  nfts: {
    items: NFT[];
    total: number;
    hasMore: boolean;
  };
  defi: DeFiPosition[];
  transactions: Transaction[];
  history: any[];
  aptPrice: number;
  totalValue: number;
  metrics: {
    totalAssets: number;
    totalNFTs: number;
    totalDeFi: number;
    change24h: number;
    changePercentage24h: number;
  };
}

// Fetch functions
const fetchPortfolioBatch = async (address: string): Promise<PortfolioData> => {
  const response = await fetch(`/api/portfolio/batch?address=${address}`);
  if (!response.ok) throw new Error('Failed to fetch portfolio data');
  return response.json();
};

const fetchAptPrice = async (): Promise<number> => {
  const response = await fetch('/api/analytics/token-latest-price?address=0x1::aptos_coin::AptosCoin');
  if (!response.ok) throw new Error('Failed to fetch APT price');
  const data = await response.json();
  return data.data?.[0]?.price_usd || 0;
};

// Main hook
export function usePortfolioQuery(address: string | undefined) {
  // Batch fetch all portfolio data
  const portfolioQuery = useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => fetchPortfolioBatch(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
  });

  // APT price with separate cache
  const aptPriceQuery = useQuery({
    queryKey: ['apt-price'],
    queryFn: fetchAptPrice,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // 1 minute
  });

  // Computed values with memoization
  const computedData = useMemo(() => {
    if (!portfolioQuery.data) {
      return {
        visibleAssets: [],
        groupedDeFi: [],
        totalValue: 0,
        pieChartData: [],
        metrics: null,
      };
    }

    const { assets = [], defi = [] } = portfolioQuery.data;

    // Filter visible assets
    const visibleAssets = assets.filter(asset => {
      // Always show APT
      if (asset.asset_type === '0x1::aptos_coin::AptosCoin') return true;
      // Filter out CELL tokens and dust
      if (asset.metadata?.symbol === 'CELL') return false;
      return (asset.value || 0) >= 0.01;
    });

    // Group DeFi positions
    const groupedDeFi = Object.values(
      defi.reduce((acc, position) => {
        const protocol = position.protocol;
        if (!acc[protocol]) {
          acc[protocol] = {
            protocol,
            positions: [],
            totalValue: 0,
          };
        }
        acc[protocol].positions.push(position);
        acc[protocol].totalValue += position.totalValueUSD || position.tvl_usd || 0;
        return acc;
      }, {} as Record<string, any>)
    );

    // Calculate total value
    const totalValue = 
      visibleAssets.reduce((sum, asset) => sum + (asset.value || 0), 0) +
      groupedDeFi.reduce((sum, group) => sum + group.totalValue, 0);

    // Generate pie chart data
    const pieChartData = [
      ...visibleAssets
        .filter(asset => (asset.value || 0) > 0)
        .map(asset => ({
          name: asset.metadata?.symbol || 'Unknown',
          value: asset.value || 0,
          percentage: ((asset.value || 0) / totalValue) * 100,
        })),
      ...groupedDeFi.map(group => ({
        name: group.protocol,
        value: group.totalValue,
        percentage: (group.totalValue / totalValue) * 100,
      })),
    ].sort((a, b) => b.value - a.value);

    return {
      visibleAssets,
      groupedDeFi,
      totalValue,
      pieChartData,
      metrics: portfolioQuery.data.metrics,
    };
  }, [portfolioQuery.data]);

  return {
    // Data
    data: portfolioQuery.data,
    visibleAssets: computedData.visibleAssets,
    nfts: portfolioQuery.data?.nfts || { items: [], total: 0, hasMore: false },
    defi: portfolioQuery.data?.defi || [],
    groupedDeFi: computedData.groupedDeFi,
    transactions: portfolioQuery.data?.transactions || [],
    history: portfolioQuery.data?.history || [],
    
    // Metrics
    totalValue: computedData.totalValue,
    pieChartData: computedData.pieChartData,
    metrics: computedData.metrics,
    aptPrice: aptPriceQuery.data || 0,
    
    // Loading states
    isLoading: portfolioQuery.isLoading || aptPriceQuery.isLoading,
    isError: portfolioQuery.isError || aptPriceQuery.isError,
    error: portfolioQuery.error || aptPriceQuery.error,
    
    // Actions
    refetch: () => {
      portfolioQuery.refetch();
      aptPriceQuery.refetch();
    },
  };
}