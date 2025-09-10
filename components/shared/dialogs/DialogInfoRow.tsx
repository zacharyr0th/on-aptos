"use client";

import type React from "react";
import { memo } from "react";

export interface DialogInfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  layout?: "horizontal" | "vertical";
  responsive?: boolean;
}

/**
 * Reusable info row component for displaying key-value pairs in dialogs
 */
export const DialogInfoRow = memo<DialogInfoRowProps>(
  ({
    label,
    value,
    className = "",
    labelClassName = "",
    valueClassName = "",
    layout = "vertical",
    responsive = true,
  }) => {
    const isHorizontal = layout === "horizontal";
    const responsiveClass =
      responsive && isHorizontal
        ? "flex flex-col sm:flex-row sm:items-center"
        : isHorizontal
          ? "flex items-center"
          : "flex flex-col";

    const labelSpacing = isHorizontal ? "sm:mb-0 sm:mr-3" : "mb-1";
    const labelWidth = isHorizontal ? "sm:w-1/3 sm:flex-shrink-0" : "";

    return (
      <div className={`${responsiveClass} ${className}`}>
        <div
          className={`text-sm text-muted-foreground ${labelSpacing} ${labelWidth} ${labelClassName}`}
        >
          {label}
        </div>
        <div className={`min-w-0 flex-1 ${valueClassName}`}>{value}</div>
      </div>
    );
  }
);

DialogInfoRow.displayName = "DialogInfoRow";
