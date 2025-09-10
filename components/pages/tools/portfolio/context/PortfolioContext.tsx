"use client";

import type React from "react";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useReducer } from "react";

type ItemType = "asset" | "nft" | "defi" | null;

interface SelectedItem {
  type: ItemType;
  data: any;
}

interface PortfolioState {
  selectedItem: SelectedItem | null;
  activeTab: "portfolio" | "transactions" | "yield";
  sidebarView: "assets" | "nfts";
  hideFilteredAssets: boolean;
  defiSortBy: "protocol" | "value" | "type";
  defiSortOrder: "asc" | "desc";
  isManualMode: boolean;
  manualAddress: string;
  addressError: string;
  aptPrice: number | null;
}

type PortfolioAction =
  | { type: "SELECT_ITEM"; payload: SelectedItem | null }
  | { type: "SET_ACTIVE_TAB"; payload: "portfolio" | "transactions" | "yield" }
  | { type: "SET_SIDEBAR_VIEW"; payload: "assets" | "nfts" }
  | { type: "TOGGLE_FILTERED_ASSETS" }
  | {
      type: "SET_DEFI_SORT";
      payload: {
        sortBy: "protocol" | "value" | "type";
        sortOrder: "asc" | "desc";
      };
    }
  | { type: "SET_MANUAL_MODE"; payload: boolean }
  | { type: "SET_MANUAL_ADDRESS"; payload: string }
  | { type: "SET_ADDRESS_ERROR"; payload: string }
  | { type: "SET_APT_PRICE"; payload: number | null }
  | { type: "CLEAR_SELECTIONS" }
  | { type: "RESET_MANUAL_MODE" };

const initialState: PortfolioState = {
  selectedItem: null,
  activeTab: "portfolio",
  sidebarView: "assets",
  hideFilteredAssets: true,
  defiSortBy: "value",
  defiSortOrder: "desc",
  isManualMode: false,
  manualAddress: "",
  addressError: "",
  aptPrice: null,
};

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case "SELECT_ITEM":
      return {
        ...state,
        selectedItem: action.payload,
        sidebarView: action.payload
          ? action.payload.type === "asset"
            ? "assets"
            : action.payload.type === "nft"
              ? "nfts"
              : action.payload.type === "defi"
                ? "assets"
                : "assets"
          : state.sidebarView,
      };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_SIDEBAR_VIEW":
      return { ...state, sidebarView: action.payload };
    case "TOGGLE_FILTERED_ASSETS":
      return { ...state, hideFilteredAssets: !state.hideFilteredAssets };
    case "SET_DEFI_SORT":
      return {
        ...state,
        defiSortBy: action.payload.sortBy,
        defiSortOrder: action.payload.sortOrder,
      };
    case "SET_MANUAL_MODE":
      return { ...state, isManualMode: action.payload };
    case "SET_MANUAL_ADDRESS":
      return { ...state, manualAddress: action.payload };
    case "SET_ADDRESS_ERROR":
      return { ...state, addressError: action.payload };
    case "SET_APT_PRICE":
      return { ...state, aptPrice: action.payload };
    case "CLEAR_SELECTIONS":
      return { ...state, selectedItem: null };
    case "RESET_MANUAL_MODE":
      return {
        ...state,
        isManualMode: false,
        manualAddress: "",
        addressError: "",
      };
    default:
      return state;
  }
}

interface PortfolioContextValue {
  state: PortfolioState;
  dispatch: React.Dispatch<PortfolioAction>;
  selectItem: (type: ItemType, data: any) => void;
  clearSelections: () => void;
  toggleFilteredAssets: () => void;
  setDeFiSort: (sortBy: "protocol" | "value" | "type", sortOrder: "asc" | "desc") => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  const selectItem = useCallback((type: ItemType, data: any) => {
    if (!type) {
      dispatch({ type: "SELECT_ITEM", payload: null });
    } else {
      dispatch({ type: "SELECT_ITEM", payload: { type, data } });
    }
  }, []);

  const clearSelections = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  }, []);

  const toggleFilteredAssets = useCallback(() => {
    dispatch({ type: "TOGGLE_FILTERED_ASSETS" });
  }, []);

  const setDeFiSort = useCallback(
    (sortBy: "protocol" | "value" | "type", sortOrder: "asc" | "desc") => {
      dispatch({ type: "SET_DEFI_SORT", payload: { sortBy, sortOrder } });
    },
    []
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      selectItem,
      clearSelections,
      toggleFilteredAssets,
      setDeFiSort,
    }),
    [state, selectItem, clearSelections, toggleFilteredAssets, setDeFiSort]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolioContext must be used within a PortfolioProvider");
  }
  return context;
}
