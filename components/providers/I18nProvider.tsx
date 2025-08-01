"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "@/lib/i18n";
import { logger } from "@/lib/utils/logger";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Log the initial state
    logger.info("I18nProvider mounted", {
      initialLanguage: i18n.language,
      localStorage: typeof window !== 'undefined' ? localStorage.getItem("i18n-language") : 'N/A',
    });
    
    setIsInitialized(true);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}