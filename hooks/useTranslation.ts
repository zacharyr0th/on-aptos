import { useTranslation as useI18NextTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  preloadPageTranslations,
  type Namespace,
  type SupportedLanguage,
} from '@/lib/i18n';
import type {
  TranslatableString,
  TranslatableStringArray,
} from '@/components/pages/defi/data/types';

/**
 * Enhanced translation hook with automatic namespace preloading
 * Provides a simpler API than react-i18next with better TypeScript support
 */
export function useTranslation(namespace: Namespace | Namespace[] = 'common') {
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];
  const { t: i18nT, i18n } = useI18NextTranslation(namespaces);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Stable namespace key for dependencies
  const namespaceKey = useMemo(
    () => namespaces.join(','),
    [namespaces.sort().join(',')]
  );

  // Track when component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadNamespaces = async () => {
      if (typeof window !== 'undefined' && isMounted) {
        try {
          await preloadPageTranslations(namespaces as Namespace[]);
          
          // Wait a bit for i18n to process the loaded resources
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Double-check that all namespaces are actually loaded
          const allLoaded = namespaces.every(ns => i18n.hasLoadedNamespace(ns));
          if (mounted && allLoaded) {
            setIsReady(true);
            setTranslationsLoaded(true);
          } else if (mounted) {
            // More aggressive retry mechanism
            let retryCount = 0;
            const retryInterval = setInterval(() => {
              const retryCheck = namespaces.every(ns => i18n.hasLoadedNamespace(ns));
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
          console.warn('Failed to load namespaces:', error);
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

    const onLanguageChanged = () => {
      setIsReady(false);
      if (isMounted) {
        loadNamespaces();
      }
    };

    i18n.on('languageChanged', onLanguageChanged);

    return () => {
      mounted = false;
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n, namespaceKey, isMounted]);

  // Safe translation with fallback - SSR compatible
  const t = useCallback(
    (key: string, fallback?: string, options?: any): string => {
      try {
        // For SSR compatibility, always return fallback or key during server render
        if (typeof window === 'undefined') {
          return fallback || key;
        }

        // During initial client render (before component is mounted), return same as server
        if (!isMounted) {
          return fallback || key;
        }

        // Always try to get the translation first, even if not "ready"
        const translated = i18nT(key, options);
        const translatedStr =
          typeof translated === 'string' ? translated : String(translated);
        
        // If we got a real translation (not the key back), use it
        if (translatedStr && translatedStr !== key) {
          return translatedStr;
        }

        // If not ready yet, trigger loading if needed
        if (!isReady) {
          const hasNamespace = namespaces.every(ns =>
            i18n.hasLoadedNamespace(ns)
          );

          if (!hasNamespace) {
            // Trigger loading if not already done
            preloadPageTranslations(namespaces as Namespace[]).catch(() => {
              // Silent fail - fallback will be used
            });
          }
          return fallback || key;
        }
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Translation missing for key: ${key}, namespaces loaded:`, 
            namespaces.map(ns => `${ns}:${i18n.hasLoadedNamespace(ns)}`),
            'isReady:', isReady,
            'isMounted:', isMounted,
            'translationsLoaded:', translationsLoaded,
            'i18n language:', i18n.language
          );
        }

        // Fallback: use provided fallback or key
        return fallback || key;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Translation error for key "${key}":`, error);
        }
        return fallback || key;
      }
    },
    [i18nT, i18n, namespaces, isReady, isMounted, translationsLoaded]
  );

  const changeLanguage = useCallback(
    async (lng: SupportedLanguage): Promise<void> => {
      try {
        await i18n.changeLanguage(lng);
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    },
    [i18n]
  );

  // Helper function to get text from i18n objects
  const getText = useCallback(
    (i18nObj: any, defaultText?: string): string => {
      if (!i18nObj) return defaultText || '';
      if (typeof i18nObj === 'string') return i18nObj;
      if (typeof i18nObj === 'object' && i18nObj[i18n.language]) {
        return i18nObj[i18n.language];
      }
      if (typeof i18nObj === 'object' && i18nObj.en) {
        return i18nObj.en;
      }
      return defaultText || '';
    },
    [i18n.language]
  );

  // Helper to get current language - for backward compatibility
  const getCurrentLanguage = useCallback(() => {
    return i18n.language as SupportedLanguage;
  }, [i18n.language]);

  return {
    t,
    i18nT,
    i18n,
    isReady: isReady && isMounted,
    currentLanguage: i18n.language as SupportedLanguage,
    changeLanguage,
    getText,
    getCurrentLanguage,
    translationsLoaded,
  };
}

// Single hook for page-specific translations
export function usePageTranslation(
  page: 'defi' | 'btc' | 'lst' | 'rwas' | 'stables'
) {
  return useTranslation(['common', page]);
}
