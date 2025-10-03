"use client";

import { useState, useCallback } from "react";
import { WalletErrorToast, type ToastMessage } from "./WalletErrorToast";
import { handlePetraError, PetraErrorCode } from "@/lib/utils/wallet/petra-errors";

export function useWalletToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: ToastMessage) => {
    setToast(message);
  }, []);

  const showError = useCallback((error: any, title: string = "Wallet Error") => {
    const errorMessage = handlePetraError(error);
    setToast({
      type: "error",
      title,
      description: errorMessage,
      duration: 6000,
    });
  }, []);

  const showSuccess = useCallback((title: string, description?: string) => {
    setToast({
      type: "success",
      title,
      description,
      duration: 4000,
    });
  }, []);

  const showWarning = useCallback((title: string, description?: string) => {
    setToast({
      type: "warning",
      title,
      description,
      duration: 5000,
    });
  }, []);

  const showInfo = useCallback((title: string, description?: string) => {
    setToast({
      type: "info",
      title,
      description,
      duration: 4000,
    });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const ToastComponent = useCallback(
    () => <WalletErrorToast message={toast} onClose={clearToast} />,
    [toast, clearToast]
  );

  return {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearToast,
    ToastComponent,
  };
}
