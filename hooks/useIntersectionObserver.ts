import { type RefObject, useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

/**
 * Hook for observing element visibility using Intersection Observer API
 * Useful for lazy loading, infinite scroll, and viewport-based animations
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, IntersectionObserverEntry | undefined] {
  const { threshold = 0, root = null, rootMargin = "0%", freezeOnceVisible = false } = options;

  const elementRef = useRef<T>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const frozen = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen.current || !element) return;

    const observerParams: IntersectionObserverInit = {
      threshold,
      root,
      rootMargin,
    };

    const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
      setEntry(entry);

      if (freezeOnceVisible && entry.isIntersecting) {
        frozen.current = true;
      }
    };

    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return [elementRef, entry];
}

/**
 * Simplified hook that returns boolean for element visibility
 */
export function useOnScreen<T extends HTMLElement = HTMLDivElement>(
  options?: UseIntersectionObserverOptions
): [RefObject<T | null>, boolean] {
  const [ref, entry] = useIntersectionObserver<T>(options);
  return [ref, !!entry?.isIntersecting];
}
