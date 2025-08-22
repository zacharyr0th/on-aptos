"use client";

import React, { ReactNode, Suspense, lazy } from "react";

import { Skeleton } from "@/components/ui/skeleton";

// Simple intersection observer hook
function useInView(options: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  const [inView, setInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (options.triggerOnce && entry.isIntersecting) {
          observer.disconnect();
        }
      },
      {
        threshold: options.threshold || 0,
        rootMargin: options.rootMargin || "0px",
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.triggerOnce]);

  return { ref, inView };
}

// ============ Virtual Scrolling for Large Lists ============

interface VirtualScrollItem {
  id: string | number;
  height?: number;
}

interface VirtualScrollProps<T extends VirtualScrollItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScroll<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = "",
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, _index) =>
            renderItem(item, startIndex + index),
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Lazy Loading with Intersection Observer ============

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  onIntersect?: () => void;
  className?: string;
}

export function LazyLoad({
  children,
  fallback = <Skeleton className="w-full h-32" />,
  rootMargin = "50px",
  threshold = 0.1,
  onIntersect,
  className,
}: LazyLoadProps) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  React.useEffect(() => {
    if (inView && onIntersect) {
      onIntersect();
    }
  }, [inView, onIntersect]);

  return (
    <div ref={ref} className={className}>
      {inView ? children : fallback}
    </div>
  );
}

// ============ Image Optimization with Progressive Loading ============

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  blurDataURL?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.svg",
  blurDataURL,
  priority = false,
  onLoad,
  onError,
  className = "",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [ setError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(priority ? src : "");
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: true,
  });

  React.useEffect(() => {
    if (inView && !priority && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [inView, priority, src, currentSrc]);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback(() => {
    setError(true);
    setIsLoading(false);
    setCurrentSrc(fallbackSrc);
    onError?.();
  }, [fallbackSrc, onError]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Blur placeholder */}
      {isLoading && blurDataURL && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {isLoading && !blurDataURL && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Actual image */}
      {currentSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          {...props}
        />
      )}
    </div>
  );
}

// ============ Code Splitting and Dynamic Imports ============

export const LazyNFTGallery = lazy( =>
  import("@/app/portfolio/_features/nfts/NFTGallery").then((module) => ({
    default: module.NFTGallery,
  })),
);

export const LazyTransactionList = lazy( =>
  import("@/app/portfolio/_features/transactions/TransactionList").then(
    (module) => ({
      default: module.TransactionList,
    }),
  ),
);

export const LazyDeFiPositions = lazy( =>
  import("@/app/portfolio/_features/defi/DeFiPositions").then((module) => ({
    default: module.DeFiPositions,
  })),
);

// ============ Memoization Helpers ============

export function useMemoizedCallback<
  T extends (...args: Array<Record<string, unknown>>) => unknown,
>(callback: T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(callback, deps) as T;
}

export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(factory, deps);
}

// Shallow comparison hook for complex objects
export function useShallowMemo<T extends Record<string, unknown>>(value: T): T {
  const ref = React.useRef<T>(value);

  const hasChanged = React.useMemo(() => {
    const keys = Object.keys(value);
    const prevKeys = Object.keys(ref.current);

    if (keys.length !== prevKeys.length) return true;

    return keys.some((key) => value[key] !== ref.current[key]);
  }, [value]);

  if (hasChanged) {
    ref.current = value;
  }

  return ref.current;
}

// ============ Performance Monitoring ============

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
}

export function usePerformanceMonitor(componentName: string) {
  const startTimeRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    startTimeRef.current = performance.now();
  });

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - (startTimeRef.current || endTime);

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
    };

    // Add memory usage if available
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize;
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === "development" && renderTime > 16) {
      perfLogger.warn(
        `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
      );
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === "production" && renderTime > 100) {
      // Send to your analytics service
      fetch("/api/analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      }).catch(() => {
        // Silent failure for analytics
      });
    }
  });

  return {
    markStart: () => {
      startTimeRef.current = performance.now();
    },
    markEnd: (label: string) => {
      const endTime = performance.now();
      const duration = endTime - (startTimeRef.current || endTime);
      perfLogger.info(`${componentName}:${label} - ${duration.toFixed(2)}ms`);
    },
  };
}

// ============ Bundle Size Optimizer ============

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyComponentLoader({
  children,
  fallback = <Skeleton className="w-full h-32" />,
}: LazyComponentProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// ============ Debounced State Hook ============

export function useDebouncedState<T>(
  initialValue: T,
  delay: number,
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, debouncedValue, setValue];
}

// ============ Resource Preloader ============

interface PreloadOptions {
  priority?: "high" | "low";
  crossOrigin?: "anonymous" | "use-credentials";
}

export function useResourcePreloader() {
  const preloadImage = React.useCallback(
    (src: string, options: PreloadOptions = {}) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = src;
      link.as = "image";

      if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin;
      }

      document.head.appendChild(link);
    },
    [],
  );

  const preloadScript = React.useCallback((src: string) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = src;
    link.as = "script";
    document.head.appendChild(link);
  }, []);

  const preloadStyle = React.useCallback((href: string) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "style";
    document.head.appendChild(link);
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadStyle,
  };
}

// ============ Memory Management ============

export function useMemoryCleanup(
  cleanupFn: () => void,
  deps: React.DependencyList,
) {
  React.useEffect(() => {
    return () => {
      cleanupFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, cleanupFn]);
}

// Hook to monitor memory usage
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = React.useState<{
    used: number;
    limit: number;
    percentage: number;
  } | null>(null);

  React.useEffect(() => {
    const checkMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const limit = memory.jsHeapSizeLimit;
        const percentage = Math.round((used / limit) * 100);

        setMemoryInfo({ used, limit, percentage });

        // Warn if memory usage is high
        if (percentage > 80) {
          perfLogger.warn(`High memory usage detected: ${percentage}%`);
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}
