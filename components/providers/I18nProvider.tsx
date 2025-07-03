'use client';

import React, { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initializeI18n } from '@/lib/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Simple initialization on client side
    initializeI18n();
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
