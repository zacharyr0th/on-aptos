"use client";

import { LayoutDashboard, Archive } from "lucide-react";
import React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewMode = "dashboard" | "legacy";

interface ViewModeSelectorProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({
  mode,
  onModeChange,
}: ViewModeSelectorProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">View:</span>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && onModeChange(value as ViewMode)}
          className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-0.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="dashboard" aria-label="Dashboard view">
                <LayoutDashboard className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Dashboard - Interactive widgets and real-time metrics</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="legacy" aria-label="Legacy view">
                <Archive className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Legacy View - Traditional layout with all features</p>
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
