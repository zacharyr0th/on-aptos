"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useReducer } from "react";
import { CleanLayout } from "./components/CleanLayout";
import { PortfolioLoadingSkeleton } from "./components/PortfolioLoadingSkeleton";

// Single source of truth for UI state
const uiReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SELECT': return { ...state, selected: action.payload };
    case 'TAB': return { ...state, tab: action.payload };
    case 'FILTER': return { ...state, hideFiltered: !state.hideFiltered };
    default: return state;
  }
};

export default function UltraSimplifiedPortfolio() {
  const { account } = useWallet();
  const address = account?.address?.toString();
  
  // UI state in one place
  const [ui, dispatch] = useReducer(uiReducer, {
    selected: null,
    tab: 'portfolio',
    hideFiltered: true,
  });

  // Single API call with React Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/batch/optimized?address=${address}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!address,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });

  // All computed values in one memo
  const portfolio = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      // Add any additional computed values here
      displayAssets: ui.hideFiltered 
        ? data.assets.filter((a: any) => a.value >= 0.01)
        : data.assets,
    };
  }, [data, ui.hideFiltered]);

  if (!address) {
    return <div className="flex items-center justify-center h-screen">
      <p>Connect your wallet to view portfolio</p>
    </div>;
  }

  if (isLoading || !portfolio) {
    return <PortfolioLoadingSkeleton />;
  }

  return (
    <CleanLayout
      address={address}
      data={{
        assets: portfolio.displayAssets,
        nfts: portfolio.nfts,
        defi: portfolio.defi,
        transactions: portfolio.transactions || [],
        totalValue: portfolio.totalValue,
        pieChartData: portfolio.pieChartData,
        metrics: portfolio.metrics,
        aptPrice: 0, // Would fetch separately or include in batch
      }}
      ui={{
        selectedItem: ui.selected,
        activeTab: ui.tab,
        sidebarView: 'assets',
        hideFilteredAssets: ui.hideFiltered,
      }}
      actions={{
        selectItem: (type, data) => dispatch({ type: 'SELECT', payload: type ? { type, data } : null }),
        setTab: (tab) => dispatch({ type: 'TAB', payload: tab }),
        toggleFilter: () => dispatch({ type: 'FILTER' }),
        refetch,
      }}
    />
  );
}