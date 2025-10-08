"use client";

import type React from "react";
import { memo, useCallback } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { ErrorFallback } from "@/components/errors/ErrorFallback";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useResponsive } from "@/lib/hooks/useResponsive";

export interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showErrorBoundary?: boolean;
}

/**
 * Base dialog component that provides common dialog functionality
 * with error boundaries and responsive sizing
 */
export const BaseDialog = memo<BaseDialogProps>(
  ({ isOpen, onClose, title, children, className = "", size = "md", showErrorBoundary = true }) => {
    const { isMobile } = useResponsive();

    const handleClose = useCallback(
      (open: boolean) => {
        if (!open) {
          onClose();
        }
      },
      [onClose]
    );

    // Size classes based on size prop and responsive design
    const getSizeClass = () => {
      if (isMobile) {
        return "max-w-[95vw] max-h-[95vh]";
      }

      switch (size) {
        case "sm":
          return "sm:max-w-md";
        case "md":
          return "sm:max-w-lg max-w-2xl";
        case "lg":
          return "max-w-2xl sm:max-w-4xl";
        case "xl":
          return "max-w-4xl sm:max-w-6xl";
        default:
          return "sm:max-w-lg max-w-2xl";
      }
    };

    const content = showErrorBoundary ? (
      <ErrorBoundary fallback={<ErrorFallback level="dialog" onClose={onClose} />}>
        {children}
      </ErrorBoundary>
    ) : (
      children
    );

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className={`${getSizeClass()} ${className} fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto ${!isMobile && "sm:max-h-[85vh]"}`}
        >
          {title && (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          )}
          {content}
        </DialogContent>
      </Dialog>
    );
  }
);

BaseDialog.displayName = "BaseDialog";
