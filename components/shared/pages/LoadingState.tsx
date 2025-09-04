"use client";

import { Loader2 } from "lucide-react";
import type { LoadingStateProps } from "./types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  message = "Loading...",
  showSpinner = true,
  className,
  variant = "default",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4",
        className,
      )}
    >
      {showSpinner && (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
