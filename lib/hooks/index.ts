// Responsive hooks
export {
  useResponsive,
  useIsMobile,
  useDeviceType,
  BREAKPOINTS,
} from "./useResponsive";

// Translation hooks
export { useTranslation, usePageTranslation } from "./useTranslation";

// Data hooks
export { useMarketPrice, useBitcoinPrice } from "./useMarketPrice";
// usePortfolioQuery removed - functionality consolidated into portfolio services
export { useDefiMetrics } from "./useDefiMetrics";
export { useProtocolMetrics } from "./useProtocolMetrics";
export {
  useGasUsage,
  useTokenPriceHistory,
  useBalanceHistory,
  useTopPriceChanges,
  useTransactionHistory,
} from "./useAptosAnalytics";

// UI interaction hooks
export { useClickOutside } from "./useClickOutside";
export { useDebounce, useDebouncedCallback } from "./useDebounce";
export {
  useIntersectionObserver,
  useOnScreen,
} from "./useIntersectionObserver";

// State management hooks
export { useLocalStorage } from "./useLocalStorage";

// Error handling hooks
export { useErrorBoundary, useAsyncError } from "./useErrorBoundary";
export { useRetry, useRetryFn } from "./useRetry";

// Wallet hooks
export { useAnsName } from "./useAnsName";

// Performance hooks
export { useDataPrefetch } from "./useDataPrefetching";
