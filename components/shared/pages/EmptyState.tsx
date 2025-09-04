"use client";

import { Inbox } from "lucide-react";
import type { EmptyStateProps } from "./types";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "No data available",
  description = "There's nothing to display at the moment",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4",
        className,
      )}
    >
      {icon || <Inbox className="h-12 w-12 text-muted-foreground" />}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
