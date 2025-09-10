"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StatItem, StatsGridProps } from "./types";

function StatCard({ stat }: { stat: StatItem }) {
  const getChangeIcon = (changeType?: "increase" | "decrease" | "stable") => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className={cn("overflow-hidden", stat.className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {stat.icon}
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p
                className={cn(
                  "text-2xl font-bold",
                  stat.valueClassName || getStatusColor(stat.status)
                )}
              >
                {stat.value}
              </p>
              {stat.change !== undefined && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(stat.changeType)}
                  <span
                    className={cn(
                      "text-sm",
                      stat.changeType === "increase"
                        ? "text-green-500"
                        : stat.changeType === "decrease"
                          ? "text-red-500"
                          : "text-gray-500"
                    )}
                  >
                    {stat.changeType === "increase" ? "+" : ""}
                    {stat.change}%
                  </span>
                </div>
              )}
            </div>
            {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats, columns = 4, isLoading, className }: StatsGridProps) {
  const gridColumns = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
  };

  if (isLoading) {
    return (
      <div className={cn("grid gap-4", gridColumns[columns], className)}>
        {[...Array(columns)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", gridColumns[columns], className)}>
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
