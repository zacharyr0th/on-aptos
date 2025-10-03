"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastMessage {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface WalletErrorToastProps {
  message: ToastMessage | null;
  onClose: () => void;
}

export function WalletErrorToast({ message, onClose }: WalletErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);

      const duration = message.duration || 5000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (message.type) {
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getVariant = () => {
    switch (message.type) {
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-md transition-all duration-300",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Alert variant={getVariant()} className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <AlertTitle className="text-sm font-semibold">{message.title}</AlertTitle>
          {message.description && (
            <AlertDescription className="text-sm mt-1">{message.description}</AlertDescription>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
