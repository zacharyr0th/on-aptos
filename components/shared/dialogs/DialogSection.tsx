"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { memo, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface DialogSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showSeparator?: boolean;
  level?: "h3" | "h4" | "h5";
}

/**
 * Reusable dialog section component with optional collapsible functionality
 */
export const DialogSection = memo<DialogSectionProps>(
  ({
    title,
    children,
    className = "",
    titleClassName = "",
    collapsible = false,
    defaultExpanded = true,
    showSeparator = false,
    level = "h3",
  }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpanded = useCallback(() => {
      if (collapsible) {
        setIsExpanded((prev) => !prev);
      }
    }, [collapsible]);

    const TitleComponent = level;
    const titleSizeClass = {
      h3: "text-base sm:text-lg",
      h4: "text-sm sm:text-base",
      h5: "text-sm",
    }[level];

    return (
      <div className={`space-y-3 ${className}`}>
        {showSeparator && <Separator />}

        <div className="flex items-center justify-between">
          <TitleComponent className={`font-semibold ${titleSizeClass} ${titleClassName}`}>
            {title}
          </TitleComponent>

          {collapsible && (
            <Button variant="ghost" size="sm" onClick={toggleExpanded} className="h-6 w-6 p-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {(!collapsible || isExpanded) && <div>{children}</div>}
      </div>
    );
  }
);

DialogSection.displayName = "DialogSection";
