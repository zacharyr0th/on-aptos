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

// Languages organized by continent
const LANGUAGES_BY_CONTINENT = {
  "North America & Europe": {
    languages: ["en", "es", "fr", "de", "pl", "ru", "pt"] as SupportedLanguage[],
    icon: "🌍",
  },
  "Asia & Pacific": {
    languages: ["zh-CN", "ja", "ko", "hi", "vi", "fil"] as SupportedLanguage[],
    icon: "🌏",
  },
  "Middle East & Africa": {
    languages: ["ar", "sw", "ha", "yo", "pcm"] as SupportedLanguage[],
    icon: "🌍",
  },
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

  // Close menu on outside click (both mouse and touch)
  React.useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      // Handle both mouse and touch events for better mobile support
      document.addEventListener("click", handleClick);
      document.addEventListener("touchstart", handleClick);
      document.addEventListener("keydown", handleEscape);

      // Prevent body scroll when menu is open on mobile
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("touchstart", handleClick);
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
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
          // Mobile: Larger touch target, Desktop: Regular size
          "p-3 sm:p-2 rounded-md",
          "bg-primary border-border",
          "text-primary-foreground",
          "hover:bg-primary/80 active:bg-primary/90",
          "transition-colors duration-200",
          "shadow-lg",
          // Mobile: Prevent text selection and improve touch
          "select-none touch-manipulation"
        )}
        type="button"
        aria-label="Change language"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4 sm:h-4 sm:w-4" />
      </button>

      {showMenu && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] sm:hidden"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          {/* Language menu */}
          <div
            className={cn(
              "absolute bottom-full mb-2 bg-popover border rounded-lg shadow-xl z-[100]",
              "animate-in fade-in-0 slide-in-from-bottom-2",
              // Mobile: Full width with margins, Desktop: Fixed width
              "left-0 right-0 mx-2 sm:left-0 sm:right-auto sm:mx-0",
              "w-auto sm:w-[700px] max-w-[95vw]",
              // Mobile: Max height with scroll, Desktop: Auto height
              "max-h-[70vh] sm:max-h-none overflow-y-auto sm:overflow-visible"
            )}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between p-3 border-b sm:hidden">
              <h3 className="font-semibold text-sm">Select Language</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground"
                aria-label="Close language menu"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {Object.entries(LANGUAGES_BY_CONTINENT).map(([continent, { languages, icon }]) => (
                <div key={continent}>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground border-b pb-1">
                    <span className="text-base">{icon}</span>
                    <span className="text-xs sm:text-sm">{continent}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageSelect(lang)}
                        className={cn(
                          "flex items-center justify-between rounded-md text-sm",
                          "transition-colors duration-200",
                          // Mobile: Larger touch targets, Desktop: Regular padding
                          "px-3 py-3 sm:py-2",
                          // Active state styling
                          lang === currentLang
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
                        )}
                        disabled={lang === currentLang}
                      >
                        <span className="text-left truncate flex-1 mr-2">
                          {LANGUAGE_LABELS[lang]}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {lang !== "en" && (
                            <Badge variant="secondary" className="text-xs h-4 px-1">
                              Beta
                            </Badge>
                          )}
                          {lang === currentLang && <span className="text-primary">✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
