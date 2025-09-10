"use client";

import { Globe } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { type SupportedLanguage, supportedLanguages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Language labels for all supported languages
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Español",
  ar: "العربية",
  de: "Deutsch",
  fil: "Filipino",
  fr: "Français",
  ha: "Hausa",
  hi: "हिन्दी",
  ja: "日本語",
  ko: "한국어",
  pcm: "Naija (Pidgin)",
  pl: "Polski",
  pt: "Português",
  ru: "Русский",
  sw: "Kiswahili",
  vi: "Tiếng Việt",
  yo: "Yorùbá",
  "zh-CN": "中文 (简体)",
};

export function LanguageToggle() {
  const [showMenu, setShowMenu] = React.useState(false);
  const [currentLang, setCurrentLang] = React.useState<SupportedLanguage>("en");
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Get current language on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("i18n-language") as SupportedLanguage;
    if (saved && supportedLanguages.includes(saved)) {
      setCurrentLang(saved);
    }
  }, []);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [showMenu]);

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    if (lang === currentLang) return;

    // Save and reload
    localStorage.setItem("i18n-language", lang);
    window.location.reload();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "flex items-center justify-center",
          "p-2 rounded-md",
          "bg-primary border-border",
          "text-primary-foreground",
          "hover:bg-primary/80",
          "transition-colors duration-200",
          "shadow-lg"
        )}
        type="button"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute left-0 bottom-full mb-2 w-[600px] max-w-[90vw] bg-popover border rounded-lg shadow-xl z-[100] animate-in fade-in-0 slide-in-from-bottom-2">
          <div className="grid grid-cols-3 gap-1 p-2">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageSelect(lang)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md text-sm",
                  "transition-colors duration-200",
                  lang === currentLang
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                disabled={lang === currentLang}
              >
                <span>{LANGUAGE_LABELS[lang]}</span>
                <div className="flex items-center gap-1">
                  {lang !== "en" && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">
                      Beta
                    </Badge>
                  )}
                  {lang === currentLang && <span>✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
