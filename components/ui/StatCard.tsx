"use client";

import Image from "next/image";
import type React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  change?: {
    value: number;
    period: string;
  };
  tooltip: string;
  isLoading?: boolean;
  showError?: boolean;
  icon?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  tooltip,
  isLoading = false,
  showError = false,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`relative flex flex-col bg-card border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help min-h-[100px] md:min-h-[120px] group ${className}`}
        >
          <div className="mb-3">
            <h2 className="text-sm md:text-base font-semibold text-card-foreground">{title}</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-lg md:text-2xl font-bold text-card-foreground font-mono mb-1">
              {isLoading ? (
                <span className="animate-pulse bg-muted rounded w-16 md:w-20 h-6 md:h-8 inline-block"></span>
              ) : showError ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                value
              )}
            </div>
            {!isLoading && change && (
              <p
                className={`text-xs font-medium ${
                  change.value > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {change.value > 0 ? "+" : ""}
                {change.value.toFixed(2)}% ({change.period})
              </p>
            )}
          </div>
          {icon && (
            <div className="absolute bottom-2 right-2">
              <Image
                src={icon.src}
                alt={icon.alt}
                width={icon.width || 20}
                height={icon.height || 20}
                className="object-contain"
              />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
