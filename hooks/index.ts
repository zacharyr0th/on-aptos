// Responsive hooks
export {
  useResponsive,
  useIsMobile,
  useDeviceType,
  BREAKPOINTS,
} from './useResponsive';

// Translation hooks
export { useTranslation, usePageTranslation } from './useTranslation';

// Performance monitoring hooks
export { usePerformanceMonitor } from './usePerformanceMonitor';
export { useWhyDidYouUpdate } from './useWhyDidYouUpdate';
export { useWebVitals } from './useWebVitals';

// Data hooks
export { useMarketPrice } from './useMarketPrice';

// Legacy exports for backward compatibility (deprecated)
export { useResponsive as useWindowSize } from './useResponsive';
export { useTranslation as useSafeTranslation } from './useTranslation';
