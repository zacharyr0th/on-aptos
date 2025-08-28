"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  const { theme = "system" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toaster = (
    <Sonner
      theme={theme as any}
      position="bottom-right"
      richColors
      expand={false}
    />
  );

  // Use portal to render at document.body level
  if (mounted && typeof document !== "undefined") {
    return createPortal(toaster, document.body);
  }

  return null;
};

export { Toaster };
