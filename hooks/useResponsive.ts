import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/lib/utils";

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

// Breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  largeDesktop: 1536,
} as const;

/**
 * Unified responsive hook that provides window dimensions and device type detection
 * Replaces both useWindowSize and use-mobile hooks
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Server-side rendering safe defaults
    if (typeof window === "undefined") {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLargeDesktop: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.largeDesktop,
      isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
    };
  });

  // Memoized debounced resize handler for better performance
  const handleResize = useMemo(
    () =>
      debounce(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setState({
          width,
          height,
          isMobile: width < BREAKPOINTS.mobile,
          isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
          isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.largeDesktop,
          isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
        });
      }, 150), // 150ms debounce delay
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Call handler immediately to sync with current size
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return state;
}

// Convenience hooks for specific use cases
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

export function useDeviceType(): "mobile" | "tablet" | "desktop" | "largeDesktop" {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  if (isDesktop) return "desktop";
  if (isLargeDesktop) return "largeDesktop";

  // Fallback (should never happen)
  return "desktop";
}

// Export breakpoints for use in other components
export { BREAKPOINTS };
