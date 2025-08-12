import { EventEmitter } from "events";

import { logger } from "@/lib/utils/core/logger";

// Singleton event emitter for i18n events
class I18nEventManager extends EventEmitter {
  private static instance: I18nEventManager;
  private languageChangeCallbacks = new Set<(lng: string) => void>();

  private constructor() {
    super();
    // Increase max listeners to prevent warnings
    this.setMaxListeners(100);
  }

  static getInstance(): I18nEventManager {
    if (!I18nEventManager.instance) {
      I18nEventManager.instance = new I18nEventManager();
    }
    return I18nEventManager.instance;
  }

  onLanguageChange(callback: (lng: string) => void): () => void {
    this.languageChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.languageChangeCallbacks.delete(callback);
    };
  }

  emitLanguageChange(lng: string) {
    this.languageChangeCallbacks.forEach((callback) => {
      try {
        callback(lng);
      } catch (error) {
        logger.error("Error in language change callback:", error);
      }
    });
  }
}

export const i18nEventManager = I18nEventManager.getInstance();
