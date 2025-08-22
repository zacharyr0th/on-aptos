"use client";

import { Eye, Keyboard, Volume2 } from "lucide-react";
import React, { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// Temporary simplified components until full UI library is available
interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function Switch({ id, checked, onCheckedChange }: SwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

interface LabelProps {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

function Label({ htmlFor, className, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium ${className || ""}`}
    >
      {children}
    </label>
  );
}

interface SliderProps {
  id?: string;
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
}

function Slider({
  id,
  min,
  max,
  step,
  value,
  onValueChange,
  className,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)]);
  };

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className || ""}`}
    />
  );
}

// ============ Accessibility Context ============

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  focusVisible: boolean;
  textScale: number;
}

interface AccessibilityContextType extends AccessibilitySettings {
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => void;
  resetSettings: () => void;
}

const AccessibilityContext = React.createContext<
  AccessibilityContextType | undefined
>(undefined);

export function useAccessibility() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
}

// ============ Accessibility Provider ============

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  keyboardNavigation: true,
  screenReaderOptimized: false,
  focusVisible: true,
  textScale: 1,
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  const [settings, setSettings] =
    React.useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("accessibility-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      logger.warn(`Failed to load accessibility settings: ${error}`);
    }
  }, []);

  // Save settings to localStorage when changed
  React.useEffect(() => {
    try {
      localStorage.setItem("accessibility-settings", JSON.stringify(settings));
    } catch (error) {
      logger.warn(`Failed to save accessibility settings: ${error}`);
    }
  }, [settings]);

  // Apply CSS classes and properties based on settings
  React.useEffect(() => {
    const root = document.documentElement;

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Large text
    if (settings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add("keyboard-navigation");
    } else {
      root.classList.remove("keyboard-navigation");
    }

    // Screen reader optimized
    if (settings.screenReaderOptimized) {
      root.classList.add("screen-reader-optimized");
    } else {
      root.classList.remove("screen-reader-optimized");
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add("focus-visible");
    } else {
      root.classList.remove("focus-visible");
    }

    // Text scale
    root.style.setProperty("--text-scale", settings.textScale.toString());

    return () => {
      // Cleanup classes on unmount
      root.classList.remove(
        "reduce-motion",
        "high-contrast",
        "large-text",
        "keyboard-navigation",
        "screen-reader-optimized",
        "focus-visible",
      );
      root.style.removeProperty("--text-scale");
    };
  }, [settings]);

  const updateSetting = React.useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = React.useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value: AccessibilityContextType = {
    ...settings,
    updateSetting,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// ============ Focus Management ============

export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

// ============ Skip Links ============

export function SkipLinks() {
  const skipLinks = [
    { href: "#main-content", text: "Skip to main content" },
    { href: "#navigation", text: "Skip to navigation" },
    { href: "#portfolio-summary", text: "Skip to portfolio summary" },
    { href: "#asset-list", text: "Skip to asset list" },
  ];

  return (
    <nav
      className="skip-links sr-only focus-within:not-sr-only"
      aria-label="Skip navigation"
    >
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {link.text}
        </a>
      ))}
    </nav>
  );
}

// ============ Screen Reader Utilities ============

interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: string;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return <span className="sr-only">{children}</span>;
}

interface LiveRegionProps {
  children: ReactNode;
  politeness?: "polite" | "assertive";
  atomic?: boolean;
}

export function LiveRegion({
  children,
  politeness = "polite",
  atomic = false,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

// ============ Keyboard Navigation Enhancements ============

export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    let mouseUsed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !mouseUsed) {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      mouseUsed = true;
      setIsKeyboardUser(false);
    };

    const handleFocus = () => {
      if (!mouseUsed) {
        setIsKeyboardUser(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("focusin", handleFocus);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("focusin", handleFocus);
    };
  }, []);

  React.useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add("keyboard-user");
    } else {
      document.body.classList.remove("keyboard-user");
    }
  }, [isKeyboardUser]);

  return isKeyboardUser;
}

// ============ ARIA Live Announcer ============

export function useAriaAnnouncer() {
  const [announcement, setAnnouncement] = React.useState("");

  const announce = React.useCallback((message: string) => {
    setAnnouncement(""); // Clear first
    setTimeout(() => setAnnouncement(message), 100); // Then announce
  }, []);

  const AriaLiveRegion = React.useCallback(
    () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    ),
    [announcement],
  );

  return { announce, AriaLiveRegion };
}

// ============ Accessibility Settings Panel ============

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({
  isOpen,
  onClose,
}: AccessibilityPanelProps) {
  const settings = useAccessibility();
  const focusTrapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
        className="w-full max-w-md p-6 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="accessibility-title" className="text-lg font-semibold">
            Accessibility Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="reduced-motion"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Reduce Motion</span>
            </Label>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) =>
                settings.updateSetting("reducedMotion", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="high-contrast"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>High Contrast</span>
            </Label>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) =>
                settings.updateSetting("highContrast", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="large-text" className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4" />
              <span>Large Text</span>
            </Label>
            <Switch
              id="large-text"
              checked={settings.largeText}
              onCheckedChange={(checked) =>
                settings.updateSetting("largeText", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="keyboard-nav"
              className="flex items-center space-x-2"
            >
              <Keyboard className="h-4 w-4" />
              <span>Keyboard Navigation</span>
            </Label>
            <Switch
              id="keyboard-nav"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) =>
                settings.updateSetting("keyboardNavigation", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="screen-reader"
              className="flex items-center space-x-2"
            >
              <Volume2 className="h-4 w-4" />
              <span>Screen Reader Mode</span>
            </Label>
            <Switch
              id="screen-reader"
              checked={settings.screenReaderOptimized}
              onCheckedChange={(checked) =>
                settings.updateSetting("screenReaderOptimized", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-scale" className="flex items-center space-x-2">
              <span>Text Scale: {Math.round(settings.textScale * 100)}%</span>
            </Label>
            <Slider
              id="text-scale"
              min={0.8}
              max={1.5}
              step={0.1}
              value={[settings.textScale]}
              onValueChange={([value]) =>
                settings.updateSetting("textScale", value)
              }
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={settings.resetSettings}
            variant="outline"
            className="flex-1"
          >
            Reset
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
