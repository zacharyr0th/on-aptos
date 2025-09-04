"use client";

import type { PageContainerProps } from "./types";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  maxWidth = "2xl",
  padding = "md",
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    none: "",
    sm: "px-4 py-4",
    md: "px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8",
    lg: "px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-12",
  };

  return (
    <main
      className={cn(
        "min-h-screen w-full",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        "mx-auto",
        className,
      )}
    >
      {children}
    </main>
  );
}
