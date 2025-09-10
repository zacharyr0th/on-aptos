"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render the button until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="bg-primary border-border shadow-lg text-primary-foreground rounded-md p-2 hover:bg-primary/80 transition-colors duration-200"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="h-4 w-4 transition-all" />
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
        <Sun className="h-4 w-4 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
