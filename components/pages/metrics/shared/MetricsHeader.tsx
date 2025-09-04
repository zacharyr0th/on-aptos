"use client";

import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MetricsHeaderProps {
  title: string;
  subtitle?: string;
  badges?: string[];
  onRefresh?: () => void;
  refreshLabel?: string;
  isRefreshing?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  title,
  subtitle,
  badges = [],
  onRefresh,
  refreshLabel = "Refresh Data",
  isRefreshing = false,
  isLoading = false,
  children,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          {children}
        </div>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
        {badges.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {badges.map((badge, index) => (
              <Badge key={index} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {onRefresh && (
        <Button
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : refreshLabel}
        </Button>
      )}
    </div>
  );
};