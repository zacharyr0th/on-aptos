import { useTranslation as useI18NextTranslation } from "react-i18next";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  preloadPageTranslations,
  type Namespace,
  type SupportedLanguage,
} from "@/lib/i18n";
import type {
  TranslatableString,
  TranslatableStringArray,
} from "@/components/pages/defi/data/types";
import { logger, errorLogger } from "@/lib/utils/core/logger";
import { i18nEventManager } from "@/lib/i18n/events";

/**
 * Enhanced translation hook with automatic namespace preloading
 * Provides a simpler API than react-i18next with better TypeScript support
 */
export function useTranslation(namespace: Namespace | Namespace[] = "common") {
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];
  const { t: i18nT, i18n } = useI18NextTranslation(namespaces);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Stable namespace key for dependencies
  const namespaceKey = useMemo(
    () => [...namespaces].sort().join(","),
    [namespaces.join(",")],
  );

  // Track when component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadNamespaces = async () => {
      if (typeof window !== "undefined" && isMounted) {
        try {
          await preloadPageTranslations(namespaces as Namespace[]);

          // Wait a bit for i18n to process the loaded resources
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Double-check that all namespaces are actually loaded
          const allLoaded = namespaces.every((ns) =>
            i18n.hasLoadedNamespace(ns),
          );
          if (mounted && allLoaded) {
            setIsReady(true);
            setTranslationsLoaded(true);
          } else if (mounted) {
            // More aggressive retry mechanism
            let retryCount = 0;
            const retryInterval = setInterval(() => {
              const retryCheck = namespaces.every((ns) =>
                i18n.hasLoadedNamespace(ns),
              );
              if (retryCheck || retryCount >= 10) {
                clearInterval(retryInterval);
                if (mounted) {
                  setIsReady(true);
                  setTranslationsLoaded(retryCheck);
                }
              }
              retryCount++;
            }, 100);
          }
        } catch (error) {
          logger.warn(
            `Failed to load namespaces: ${error instanceof Error ? error.message : String(error)}`,
          );
          if (mounted) setIsReady(true); // Set ready anyway to avoid permanent loading state
        }
      } else {
        // SSR: Only ready if we have the common namespace
        setIsReady(true);
      }
    };

    // Only start loading after component is mounted
    if (isMounted) {
      loadNamespaces();
    }

    // Use centralized event manager instead of direct i18n listeners
    const cleanup = i18nEventManager.onLanguageChange(() => {
      setIsReady(false);
      if (isMounted) {
        loadNamespaces();
      }
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, [i18n, namespaceKey, isMounted]);

  // Memoize namespace check function
  const hasLoadedNamespaces = useMemo(
    () => () => namespaces.every((ns) => i18n.hasLoadedNamespace(ns)),
    [namespaces, i18n],
  );

  // Safe translation with fallback - SSR compatible
  const t = useCallback(
    (key: string, fallback?: string, options?: any): string => {
      // Fast path for SSR
      if (typeof window === "undefined" || !isMounted) {
        return fallback || key;
      }

      try {
        // Always try to get the translation first, even if not "ready"
        const translated = i18nT(key, options);
        const translatedStr =
          typeof translated === "string" ? translated : String(translated);

        // If we got a real translation (not the key back), use it
        if (translatedStr && translatedStr !== key) {
          return translatedStr;
        }

        // If not ready yet, trigger loading if needed
        if (!isReady && !hasLoadedNamespaces()) {
          // Trigger loading if not already done
          preloadPageTranslations(namespaces as Namespace[]).catch(() => {
            // Silent fail - fallback will be used
          });
        }

        // Debug logging in development
        if (process.env.NODE_ENV === "development" && translatedStr === key) {
          logger.debug(
            `Translation missing for key: ${key}, namespaces loaded:`,
            namespaces.map((ns) => `${ns}:${i18n.hasLoadedNamespace(ns)}`),
          );
        }

        // Fallback: use provided fallback or key
        return fallback || key;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.warn(
            `Translation error for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        return fallback || key;
      }
    },
    [i18nT, i18n, namespaces, isReady, isMounted, hasLoadedNamespaces],
  );

  const changeLanguage = useCallback(
    async (lng: SupportedLanguage): Promise<void> => {
      try {
        await i18n.changeLanguage(lng);
      } catch (error) {
        errorLogger.error(
          `Failed to change language: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    [i18n],
  );

  // Helper function to get text from i18n objects
  const getText = useCallback(
    (i18nObj: any, defaultText?: string): string => {
      if (!i18nObj) return defaultText || "";
      if (typeof i18nObj === "string") return i18nObj;
      if (typeof i18nObj === "object" && i18nObj[i18n.language]) {
        return i18nObj[i18n.language];
      }
      if (typeof i18nObj === "object" && i18nObj.en) {
        return i18nObj.en;
      }
      return defaultText || "";
    },
    [i18n.language],
  );

  // Helper to get current language - memoized
  const getCurrentLanguage = useMemo(
    () => i18n.language as SupportedLanguage,
    [i18n.language],
  );

  return useMemo(
    () => ({
      t,
      i18nT,
      i18n,
      isReady: isReady && isMounted,
      currentLanguage: i18n.language as SupportedLanguage,
      changeLanguage,
      getText,
      getCurrentLanguage,
      translationsLoaded,
    }),
    [
      t,
      i18nT,
      i18n,
      isReady,
      isMounted,
      changeLanguage,
      getText,
      getCurrentLanguage,
      translationsLoaded,
    ],
  );
}

// Single hook for page-specific translations
export function usePageTranslation(
  page: "defi" | "btc" | "rwas" | "stables" | "lst",
) {
  return useTranslation(["common", page]);
}
