import i18n from "i18next";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { i18nEventManager } from "@/lib/i18n/events";
import { logger } from "@/lib/utils/core/logger";
import commonEn from "../../public/locales/en/common.json";

// Only import English translations for SSR - other languages load on demand

export const supportedLanguages = [
  "en",
  "es",
  "ar",
  "de",
  "fil",
  "fr",
  "ha",
  "hi",
  "ja",
  "ko",
  "pcm",
  "pl",
  "pt",
  "ru",
  "sw",
  "vi",
  "yo",
  "zh-CN",
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "en";
export const namespaces = [
  "common",
  "defi",
  "rwas",
  "stables",
  "btc",
  "lst",
  "performance",
  "portfolio",
] as const;
export type Namespace = (typeof namespaces)[number];

// Critical namespaces that should be preloaded for better UX (currently unused)
// const criticalNamespaces: Namespace[] = ["common"];

// Check if running on server
const isServer = typeof window === "undefined";

// Browser language detection with better fallback logic (currently unused)
// const detectUserLanguage = (): SupportedLanguage => {
//   if (isServer) return defaultLanguage;
//
//   try {
//     // Check localStorage first
//     const saved = localStorage.getItem("i18n-language") as SupportedLanguage;
//     if (saved && supportedLanguages.includes(saved)) {
//       logger.info(`Detected saved language from localStorage: ${saved}`);
//       return saved;
//     }
//   } catch (error) {
//     logger.warn("Failed to read from localStorage:", error);
//   }
//
//   // Check browser languages
//   const browserLanguages = navigator.languages || [navigator.language];
//
//   for (const lang of browserLanguages) {
//     // Check exact match first
//     if (supportedLanguages.includes(lang as SupportedLanguage)) {
//       return lang as SupportedLanguage;
//     }
//
//     // Check language code without region (e.g., 'en-US' -> 'en')
//     const langCode = lang.split("-")[0];
//     if (supportedLanguages.includes(langCode as SupportedLanguage)) {
//       return langCode as SupportedLanguage;
//     }
//
//     // Special case for Chinese
//     if (lang.startsWith("zh")) {
//       return "zh-CN";
//     }
//   }
//
//   return defaultLanguage;
// };

// Optimized i18n configuration
const i18nConfig = {
  lng: defaultLanguage, // Start with default, will be updated on client
  fallbackLng: defaultLanguage,
  debug: false, // Disable debug in production for performance

  supportedLngs: supportedLanguages,
  ns: namespaces,
  defaultNS: "common",

  interpolation: {
    escapeValue: false, // React already escapes
  },

  react: {
    useSuspense: false, // Better SSR compatibility
  },

  // Load missing keys from default namespace
  saveMissing: false,

  // Performance optimizations
  load: "languageOnly" as const, // Don't load region-specific if not needed
  preload: isServer ? [defaultLanguage] : [], // Only preload on server

  // Backend configuration for client-side loading
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
    requestOptions: {
      cache: "force-cache", // Aggressive caching
      credentials: "same-origin",
    },
    // Custom request with retry logic and better error handling
    request: async (options: any, url: string, payload: any, callback: any) => {
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok && attempt < maxRetries) {
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          if (!response.ok) {
            callback(`Failed to load ${url}: ${response.status}`, null);
            return;
          }

          const data = await response.json();
          callback(null, { status: response.status, data });
          return;
        } catch (error) {
          if (attempt < maxRetries) {
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          } else {
            callback(error, null);
          }
        }
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

  // After initialization, check for saved language preference
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem("i18n-language") as SupportedLanguage;
      if (saved && supportedLanguages.includes(saved) && saved !== i18n.language) {
        logger.info(`Found saved language preference: ${saved}, applying...`);
        i18n.changeLanguage(saved);
      }
    } catch (error) {
      logger.warn(
        `Failed to apply saved language preference: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Client-side language management
if (!isServer) {
  // Single global listener for language changes
  i18n.on("languageChanged", (lng) => {
    localStorage.setItem("i18n-language", lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";

    // Emit to our centralized event manager
    i18nEventManager.emitLanguageChange(lng);
  });
}

// This function is no longer needed since we set the initial language in the config
// Keeping for backward compatibility but it just logs the current state
export const initializeI18n = async (): Promise<boolean> => {
  if (isServer) return true;

  logger.info(
    {
      currentLanguage: i18n.language,
      savedLanguage: localStorage.getItem("i18n-language"),
    },
    "i18n already initialized"
  );

  return true;
};

// Preload a namespace for current language - simplified version
export const preloadNamespace = async (namespace: Namespace): Promise<void> => {
  if (isServer || i18n.hasResourceBundle(i18n.language, namespace)) return;

  try {
    await i18n.loadNamespaces(namespace);
  } catch (error) {
    logger.warn(
      `Failed to preload namespace ${namespace}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// Preload all namespaces for a specific page
export const preloadPageTranslations = async (pageNamespaces: Namespace[]): Promise<void> => {
  if (isServer) return;

  try {
    await Promise.all(pageNamespaces.map((ns) => preloadNamespace(ns)));
  } catch (error) {
    logger.warn(
      `Failed to preload page translations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export default i18n;
