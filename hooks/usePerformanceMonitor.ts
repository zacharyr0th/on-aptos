import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  props: Record<string, any>;
}

/**
 * Hook to monitor component performance metrics
 * Tracks render time and component lifecycle
 */
export function usePerformanceMonitor(
  componentName: string,
  props?: Record<string, any>
): void {
  const renderStartTime = useRef<number>(performance.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    // Calculate render time
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    renderCount.current += 1;

    // Only log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`[Performance] ${componentName} slow render:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        props: props || {},
      });
    }

    // Update start time for next render
    renderStartTime.current = renderEndTime;
  });

  // Log mount/unmount in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} mounted`);

      return () => {
        console.log(
          `[Performance] ${componentName} unmounted after ${renderCount.current} renders`
        );
      };
    }
  }, [componentName]);
}
