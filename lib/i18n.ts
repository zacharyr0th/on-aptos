import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

// Only import English translations for SSR - other languages load on demand
import commonEn from '../public/locales/en/common.json';

export const supportedLanguages = [
  'en',
  'es',
  'ar',
  'de',
  'fr',
  'ha',
  'hi',
  'ja',
  'ko',
  'pt',
  'ru',
  'zh-CN',
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'en';
export const namespaces = [
  'common',
  'defi',
  'rwas',
  'stables',
  'lst',
  'btc',
] as const;
export type Namespace = (typeof namespaces)[number];

// Critical namespaces that should be preloaded for better UX
const criticalNamespaces: Namespace[] = ['common'];

// Check if running on server
const isServer = typeof window === 'undefined';

// Browser language detection with better fallback logic
const detectUserLanguage = (): SupportedLanguage => {
  if (isServer) return defaultLanguage;

  // Check localStorage first
  const saved = localStorage.getItem('i18n-language') as SupportedLanguage;
  if (saved && supportedLanguages.includes(saved)) {
    return saved;
  }

  // Check browser languages
  const browserLanguages = navigator.languages || [navigator.language];

  for (const lang of browserLanguages) {
    // Check exact match first
    if (supportedLanguages.includes(lang as SupportedLanguage)) {
      return lang as SupportedLanguage;
    }

    // Check language code without region (e.g., 'en-US' -> 'en')
    const langCode = lang.split('-')[0];
    if (supportedLanguages.includes(langCode as SupportedLanguage)) {
      return langCode as SupportedLanguage;
    }

    // Special case for Chinese
    if (lang.startsWith('zh')) {
      return 'zh-CN';
    }
  }

  return defaultLanguage;
};

// Optimized i18n configuration
const i18nConfig = {
  lng: defaultLanguage, // Always start with English for SSR
  fallbackLng: defaultLanguage,
  debug: false, // Disable debug in production for performance

  supportedLngs: supportedLanguages,
  ns: namespaces,
  defaultNS: 'common',

  interpolation: {
    escapeValue: false, // React already escapes
  },

  react: {
    useSuspense: false, // Better SSR compatibility
  },

  // Load missing keys from default namespace
  saveMissing: false,

  // Performance optimizations
  load: 'languageOnly' as const, // Don't load region-specific if not needed
  preload: isServer ? [defaultLanguage] : [], // Only preload on server

  // Backend configuration for client-side loading
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    requestOptions: {
      cache: 'force-cache', // Aggressive caching
      credentials: 'same-origin',
    },
    // Custom request with better error handling
    request: async (options: any, url: string, payload: any, callback: any) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          callback(`Failed to load ${url}: ${response.status}`, null);
          return;
        }
        const data = await response.json();
        callback(null, { status: response.status, data });
      } catch (error) {
        callback(error, null);
      }
    },
  },

  // Minimal resources for SSR - only English common namespace
  resources: isServer
    ? {
        en: {
          common: commonEn,
        },
      }
    : undefined,
};

// Initialize differently for server vs client
if (isServer) {
  // Server: Simple sync initialization with minimal resources
  i18n.use(initReactI18next).init(i18nConfig);
} else {
  // Client: Use HTTP backend for lazy loading
  i18n.use(HttpApi).use(initReactI18next).init(i18nConfig);
}

// Client-side language management
if (!isServer) {
  // Save language preference
  i18n.on('languageChanged', lng => {
    localStorage.setItem('i18n-language', lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  });
}

// Optimized client initialization
export const initializeI18n = async () => {
  if (isServer) return;

  const userLanguage = detectUserLanguage();

  // If user language is not the default, load it
  if (userLanguage !== defaultLanguage) {
    try {
      // First ensure the language is loaded
      await i18n.loadLanguages(userLanguage);

      // Then load critical namespaces for that language
      await Promise.all(criticalNamespaces.map(ns => i18n.loadNamespaces(ns)));

      // Finally change the language
      await i18n.changeLanguage(userLanguage);
    } catch (error) {
      console.warn(
        `Failed to load language ${userLanguage}, using default`,
        error
      );
    }
  }
};

// Preload a namespace for current language
export const preloadNamespace = async (namespace: Namespace) => {
  if (isServer) return;

  const currentLang = i18n.language;
  try {
    // Force reload the namespace to ensure it's available
    await i18n.reloadResources(currentLang, namespace);
    await i18n.loadNamespaces(namespace);
  } catch (error) {
    console.warn(`Failed to preload namespace ${namespace}`, error);
    // Try alternative loading approach
    try {
      await i18n.loadNamespaces(namespace);
    } catch (fallbackError) {
      console.warn(`Fallback namespace loading also failed for ${namespace}`, fallbackError);
    }
  }
};

// Preload all namespaces for a specific page
export const preloadPageTranslations = async (pageNamespaces: Namespace[]) => {
  if (isServer) return;

  try {
    await Promise.all(pageNamespaces.map(ns => preloadNamespace(ns)));
  } catch (error) {
    console.warn('Failed to preload page translations', error);
  }
};

export default i18n;
