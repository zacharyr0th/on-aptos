import { useEffect } from 'react';

interface WebVitalsMetric {
  name: 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Hook to measure and report Web Vitals metrics
 * Uses the web-vitals library for accurate measurements
 */
export function useWebVitals(
  onReport?: (metric: WebVitalsMetric) => void
): void {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Dynamically import web-vitals to reduce bundle size
    import('web-vitals')
      .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
        const reportHandler = (metric: WebVitalsMetric) => {
          // Log to console in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[WebVitals] ${metric.name}:`, {
              value: metric.value,
              rating: metric.rating,
            });
          }

          // Call custom handler if provided
          onReport?.(metric);

          // Send to analytics in production
          if (
            process.env.NODE_ENV === 'production' &&
            typeof window !== 'undefined'
          ) {
            // Example: send to Google Analytics
            if ('gtag' in window) {
              (window as any).gtag('event', metric.name, {
                value: Math.round(
                  metric.name === 'CLS' ? metric.value * 1000 : metric.value
                ),
                metric_id: metric.id,
                metric_value: metric.value,
                metric_delta: metric.delta,
                metric_rating: metric.rating,
              });
            }
          }
        };

        // Register all Web Vitals observers
        onCLS(reportHandler);
        onINP(reportHandler);
        onLCP(reportHandler);
        onFCP(reportHandler);
        onTTFB(reportHandler);
      })
      .catch(error => {
        console.error('Failed to load web-vitals:', error);
      });
  }, [onReport]);
}
