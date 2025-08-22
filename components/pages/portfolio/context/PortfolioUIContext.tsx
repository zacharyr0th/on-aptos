"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";

interface PortfolioUIState {
  selectedItem: { type: 'asset' | 'nft' | 'defi'; data: any } | null;
  activeTab: 'portfolio' | 'transactions' | 'yield';
  sidebarView: 'assets' | 'nfts' | 'defi';
  hideFilteredAssets: boolean;
  defiSortBy: 'protocol' | 'value' | 'type';
  defiSortOrder: 'asc' | 'desc';
}

type UIAction =
  | { type: 'SELECT_ITEM'; payload: { type: 'asset' | 'nft' | 'defi'; data: any } | null }
  | { type: 'SET_TAB'; payload: 'portfolio' | 'transactions' | 'yield' }
  | { type: 'SET_VIEW'; payload: 'assets' | 'nfts' | 'defi' }
  | { type: 'TOGGLE_FILTER' }
  | { type: 'SET_SORT'; sortBy: 'protocol' | 'value' | 'type'; sortOrder: 'asc' | 'desc' };

const initialState: PortfolioUIState = {
  selectedItem: null,
  activeTab: 'portfolio',
  sidebarView: 'assets',
  hideFilteredAssets: true,
  defiSortBy: 'value',
  defiSortOrder: 'desc',
};

function uiReducer(state: PortfolioUIState, action: UIAction): PortfolioUIState {
  switch (action.type) {
    case 'SELECT_ITEM':
      return { 
        ...state, 
        selectedItem: action.payload,
        sidebarView: action.payload ? action.payload.type + 's' as any : state.sidebarView
      };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_VIEW':
      return { ...state, sidebarView: action.payload };
    case 'TOGGLE_FILTER':
      return { ...state, hideFilteredAssets: !state.hideFilteredAssets };
    case 'SET_SORT':
      return { ...state, defiSortBy: action.sortBy, defiSortOrder: action.sortOrder };
    default:
      return state;
  }
}

const PortfolioUIContext = createContext<{
  state: PortfolioUIState;
  dispatch: React.Dispatch<UIAction>;
} | undefined>(undefined);

export function PortfolioUIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  return (
    <PortfolioUIContext.Provider value={{ state, dispatch }}>
      {children}
    </PortfolioUIContext.Provider>
  );
}

export function usePortfolioUI() {
  const context = useContext(PortfolioUIContext);
  if (!context) throw new Error('usePortfolioUI must be used within PortfolioUIProvider');
  return context;
}