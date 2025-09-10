"use client";

import React, { type ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "@/lib/i18n";
import { logger } from "@/lib/utils/core/logger";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Log the initial state
    logger.info(
      {
        initialLanguage: i18n.language,
        localStorage: typeof window !== "undefined" ? localStorage.getItem("i18n-language") : "N/A",
      },
      "I18nProvider mounted"
    );
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
