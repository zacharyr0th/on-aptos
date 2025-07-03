'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { supportedLanguages, type SupportedLanguage } from '@/lib/i18n';

// Language labels for all supported languages
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  ar: 'العربية',
  de: 'Deutsch',
  fr: 'Français',
  ha: 'Hausa',
  hi: 'हिन्दी',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  ru: 'Русский',
  'zh-CN': '中文 (简体)',
};

export function LanguageToggle() {
  const { getCurrentLanguage, changeLanguage, isReady, t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const [isChanging, setIsChanging] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (isChanging) return;

    setIsChanging(true);
    try {
      // Our optimized changeLanguage handles namespace loading
      await changeLanguage(lang);

      if (process.env.NODE_ENV === 'development') {
        console.log(`Language changed to: ${lang}`);
      }
    } catch (error) {
      console.error(`Failed to change language to ${lang}:`, error);
    } finally {
      setIsChanging(false);
    }
  };

  if (!mounted) {
    // Render a neutral button to avoid hydration mismatch
    return (
      <button
        className="!bg-black dark:!bg-white !border-black/20 dark:!border-white/20 !shadow-lg text-white dark:text-black rounded-md p-2"
        aria-label={t('common:actions.switch_language', 'Switch language')}
        disabled
      >
        <Globe className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">{t('common:actions.switch_language', 'Switch language')}</span>
      </button>
    );
  }

  const currentLanguage = getCurrentLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="!bg-black dark:!bg-white !border-black/20 dark:!border-white/20 !shadow-lg text-white dark:text-black rounded-md p-2 hover:!bg-black/80 dark:hover:!bg-white/80 disabled:opacity-50"
          aria-label={t('common:actions.switch_language', 'Switch language')}
          disabled={!isReady || isChanging}
        >
          <Globe className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">{t('common:actions.switch_language', 'Switch language')}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map(lang => (
          <DropdownMenuItem
            key={lang}
            onSelect={() => handleLanguageChange(lang)}
            className={currentLanguage === lang ? 'font-bold text-primary' : ''}
            disabled={isChanging || currentLanguage === lang}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span>{LANGUAGE_LABELS[lang]}</span>
              <span className="flex items-center gap-2 min-w-[56px] justify-end">
                {lang !== 'en' && <Badge variant="secondary">{t('common:labels.beta', 'Beta')}</Badge>}
                {currentLanguage === lang && <span className="ml-1">✓</span>}
                {isChanging && currentLanguage !== lang && (
                  <span className="ml-1 animate-spin">⟳</span>
                )}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
