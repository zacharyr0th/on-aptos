"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/hooks/useTranslation";

type ErrorLevel = "dialog" | "component" | "page";

interface ErrorFallbackProps {
  level?: ErrorLevel;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  level = "component",
  onRetry,
  onClose,
  className = "",
}) => {
  const { t } = useTranslation("common");

  const config = {
    dialog: {
      container: "py-8 text-center",
      title: "text-lg font-semibold mb-3 text-card-foreground",
      message: "text-sm text-muted-foreground mb-6",
      titleText: t("messages.details_unavailable", "Details Unavailable"),
      messageText: t(
        "messages.dialog_error_message",
        "An error occurred while trying to display the information. You can try closing and reopening this dialog.",
      ),
      buttonVariant: "outline" as const,
      buttonText: t("actions.close_dialog", "Close Dialog"),
      showRetry: false,
    },
    component: {
      container: "p-4 rounded-md bg-destructive/10 text-destructive",
      title: "text-lg font-semibold mb-2",
      message: "text-sm",
      titleText: "Application Error",
      messageText:
        "We're experiencing technical difficulties. Please refresh the page or contact support if the issue persists.",
      buttonVariant: "default" as const,
      buttonText: "Retry",
      showRetry: true,
    },
    page: {
      container: "flex min-h-screen items-center justify-center p-4",
      title: "text-2xl font-bold mb-4",
      message: "text-muted-foreground mb-4",
      titleText: "Something went wrong",
      messageText:
        "We apologize for the inconvenience. Please try refreshing the page.",
      buttonVariant: "default" as const,
      buttonText: "Refresh Page",
      showRetry: true,
    },
  };

  const currentConfig = config[level];
  const handleAction =
    level === "page" ? () => window.location.reload() : onRetry || onClose;

  return (
    <div className={`${currentConfig.container} ${className}`}>
      {level === "page" && (
        <div className="text-center">
          <h2 className={currentConfig.title}>{currentConfig.titleText}</h2>
          <p className={currentConfig.message}>{currentConfig.messageText}</p>
          {handleAction && (
            <button
              onClick={handleAction}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {currentConfig.buttonText}
            </button>
          )}
        </div>
      )}

      {level !== "page" && (
        <>
          <h3 className={currentConfig.title}>{currentConfig.titleText}</h3>
          <p className={currentConfig.message}>{currentConfig.messageText}</p>
          {handleAction && (
            <Button
              onClick={handleAction}
              variant={currentConfig.buttonVariant}
            >
              {currentConfig.buttonText}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
