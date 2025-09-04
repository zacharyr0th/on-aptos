"use client";

import { RefreshCw } from "lucide-react";
import type { PageHeaderProps } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  badges,
  isLoading,
  onRefresh,
  refreshLabel = "Refresh",
  isRefreshing,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground">
              {subtitle}
            </p>
          )}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {badges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  (isLoading || isRefreshing) && "animate-spin",
                )}
              />
              {refreshLabel}
            </Button>
          )}
          {actions}
          {children}
        </div>
      </div>
    </div>
  );
}
