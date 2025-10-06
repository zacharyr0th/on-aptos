"use client";

import React from "react";
import { logger } from "@/lib/utils/core/logger";
import { ErrorFallback } from "./ErrorFallback";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  level?: "dialog" | "component" | "page";
  onRetry?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log full error details
    console.error("[ERROR] Component Error Boundary caught error:", error);
    console.error("[ERROR] Error message:", error.message);
    console.error("[ERROR] Error stack:", error.stack);
    console.error("[ERROR] Component stack:", errorInfo.componentStack);

    logger.error("Component Error Boundary:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback level={this.props.level || "component"} onRetry={this.handleRetry} />
        )
      );
    }

    return this.props.children;
  }
}
