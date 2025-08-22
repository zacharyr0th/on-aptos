"use client";

import { AlertTriangle, RefreshCw, Home, Bug, Send } from "lucide-react";
import React, { Component, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Temporary simplified Collapsible components
interface CollapsibleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

function Collapsible({ children }: CollapsibleProps) {
  return <div>{children}</div>;
}

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

function CollapsibleTrigger({ children }: CollapsibleTriggerProps) {
  return <>{children}</>;
}

interface CollapsibleContentProps {
  className?: string;
  children: ReactNode;
}

function CollapsibleContent({ className, children }: CollapsibleContentProps) {
  return <div className={className}>{children}</div>;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: "page" | "section" | "component";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  allowRetry?: boolean;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  isCollapsedOpen: boolean;
}

/**
 * Production-ready Error Boundary with enhanced features:
 * - Granular error levels (page/section/component)
 * - Retry functionality with exponential backoff
 * - Error reporting integration
 * - Graceful degradation
 * - Accessibility improvements
 */
export class RobustErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isCollapsedOpen: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { level = "component", onError } = this.props;

    // Enhanced logging with context
    errorLogger.error(
      `React Error Boundary caught error at ${level} level - message: ${error.message}, stack: ${error.stack}, retryCount: ${this.state.retryCount}`,
    );

    // Store error info for debugging
    this.setState({ errorInfo });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Report to external error tracking service (in production)
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo, level);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private reportError = async (
    error: Error,
    errorInfo: React.ErrorInfo,
    level: string,
  ) => {
    try {
      // Send to error tracking service (Sentry, LogRocket, etc.)
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: null, // Add user ID if available
      };

      // In a real app, send to your error tracking service
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silent failure for error reporting to not cascade
      });
    } catch {
      // Silent failure for error reporting
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      return;
    }

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1,
      });
    }, delay);
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    const subject = encodeURIComponent(
      `Bug Report: ${error.message.slice(0, 50)}...`,
    );
    const body = encodeURIComponent(
      `Error Details:\n\n${JSON.stringify(errorDetails, null, 2)}\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:\n`,
    );

    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  private getErrorSeverity = (): "low" | "medium" | "high" => {
    const { level = "component" } = this.props;
    const { error } = this.state;

    if (level === "page") return "high";
    if (level === "section") return "medium";

    // Check error type for component level
    if (
      error?.name === "ChunkLoadError" ||
      error?.message.includes("Loading chunk")
    ) {
      return "high"; // Network/bundle issues
    }

    return "low";
  };

  private renderErrorUI = () => {
    const {
      level = "component",
      allowRetry = true,
      showErrorDetails = process.env.NODE_ENV === "development",
    } = this.props;
    const { error, errorInfo, retryCount, isCollapsedOpen } = this.state;
    const severity = this.getErrorSeverity();
    const maxRetries = 3;
    const canRetry = allowRetry && retryCount < maxRetries;

    const severityConfig = {
      low: {
        icon: Bug,
        color: "bg-yellow-100 text-yellow-800",
        title: "Component Error",
      },
      medium: {
        icon: AlertTriangle,
        color: "bg-orange-100 text-orange-800",
        title: "Section Error",
      },
      high: {
        icon: AlertTriangle,
        color: "bg-red-100 text-red-800",
        title: "Critical Error",
      },
    };

    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
      <Card className="p-6 m-4 border-destructive/20">
        <div className="flex flex-col space-y-4">
          {/* Error Header */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg text-foreground">
                  {config.title}
                </h3>
                <Badge className={config.color}>Level: {level}</Badge>
                {retryCount > 0 && (
                  <Badge variant="outline">
                    Retry {retryCount}/{maxRetries}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {severity === "high"
                  ? "A critical error occurred that prevents this section from loading."
                  : severity === "medium"
                    ? "An error occurred in this section. Some features may be unavailable."
                    : "A minor error occurred with this component."}
              </p>

              {/* Error Message */}
              <div className="bg-muted/50 rounded-md p-3 mb-4">
                <p className="text-sm font-mono text-muted-foreground break-words">
                  {error?.message || "An unknown error occurred"}
                </p>
              </div>
            </div>
          </div>

          {/* Error Details (Development) */}
          {showErrorDetails && error && (
            <Collapsible
              open={isCollapsedOpen}
              onOpenChange={(open) =>
                this.setState((prev) => ({ ...prev, isCollapsedOpen: open }))
              }
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  Technical Details
                  <Badge variant="secondary" className="ml-2">
                    Dev Only
                  </Badge>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Stack Trace:</h4>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>

                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        Component Stack:
                      </h4>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {canRetry && (
              <Button
                variant="default"
                size="sm"
                onClick={this.handleRetry}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>
                  {retryCount > 0
                    ? `Retry (${retryCount}/${maxRetries})`
                    : "Try Again"}
                </span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Page</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/")}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={this.handleReportBug}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Report Issue</span>
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorUI();
    }

    return this.props.children;
  }
}

// HOC for easier component wrapping
export function withRobustErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<Props> = {},
) {
  return function WithRobustErrorBoundaryComponent(props: P) {
    return (
      <RobustErrorBoundary {...options}>
        <Component {...props} />
      </RobustErrorBoundary>
    );
  };
}

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RobustErrorBoundary level="page" allowRetry={true}>
    {children}
  </RobustErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RobustErrorBoundary level="section" allowRetry={true}>
    {children}
  </RobustErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RobustErrorBoundary level="component" allowRetry={false}>
    {children}
  </RobustErrorBoundary>
);
