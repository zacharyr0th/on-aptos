"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a neutral button to avoid hydration mismatch
    return (
      <button
        className="bg-primary border-border shadow-lg text-primary-foreground rounded-md p-2"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] transition-all" />
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="bg-primary border-border shadow-lg text-primary-foreground rounded-md p-2 hover:bg-primary/80 transition-colors duration-200"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
    >
      {isDark ? (
        <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
