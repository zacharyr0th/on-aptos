"use client";

import type { LucideIcon } from "lucide-react";
import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

// Reusable stat card component
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  variant?: "default" | "minimal" | "bordered";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtitle,
  variant = "default",
  className = "",
}) => {
  const content = (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground/70" />}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          {label}
        </span>
      </div>
      <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
        {typeof value === "number" && value > 100 ? formatCurrency(value) : value}
      </p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );

  if (variant === "minimal") {
    return (
      <div className={className}>
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
          {label}
        </p>
        <p className="text-xl font-light">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    );
  }

  if (variant === "bordered") {
    return (
      <div className={`p-3 sm:p-4 border-r border-border/30 last:border-r-0 ${className}`}>
        {content}
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={className}>
      <CardContent className="p-3 sm:p-4">{content}</CardContent>
    </Card>
  );
};

// Stats grid layout
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
  variant?: "cards" | "bordered" | "minimal";
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 3,
  className = "",
  variant = "cards",
}) => {
  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  if (variant === "bordered") {
    return (
      <div className={`border border-border/30 rounded-lg ${className}`}>
        <div className={`grid ${gridClass[columns]}`}>{children}</div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`grid ${gridClass[columns]} gap-4 sm:gap-6 ${className}`}>{children}</div>
    );
  }

  // Default cards variant
  return <div className={`grid ${gridClass[columns]} gap-4 ${className}`}>{children}</div>;
};

// Protocol logos row component
interface ProtocolLogosProps {
  protocols: Array<{
    name: string;
    logo: string;
    value?: number;
  }>;
  onProtocolClick?: (protocol: any) => void;
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProtocolLogos: React.FC<ProtocolLogosProps> = ({
  protocols,
  onProtocolClick,
  maxVisible = 8,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const visibleProtocols = protocols.slice(0, maxVisible);
  const remainingCount = protocols.length - maxVisible;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex flex-wrap gap-3">
        {visibleProtocols.map((protocol, index) => (
          <div
            key={index}
            className={`${sizeClasses[size]} rounded-lg bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden hover:border-border/60 transition-colors ${
              onProtocolClick ? "cursor-pointer" : ""
            }`}
            onClick={() => onProtocolClick?.(protocol)}
            title={protocol.name}
          >
            <img
              src={protocol.logo}
              alt={`${protocol.name} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = "/placeholder.jpg";
              }}
            />
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-muted border border-border/30 flex items-center justify-center`}
        >
          <span className="text-xs font-medium text-muted-foreground">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

// Empty state component
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => (
  <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-center max-w-sm mx-auto mb-4">{description}</p>
    {action &&
      (action.href ? (
        <a
          href={action.href}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
        >
          {action.label}
        </a>
      ) : (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
        >
          {action.label}
        </button>
      ))}
  </div>
);

// Section header component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
}) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div>
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Metric badge component
interface MetricBadgeProps {
  label: string;
  value: string | number;
  change?: number;
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning";
  className?: string;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  change,
  variant = "default",
  className = "",
}) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    <Badge
      variant={
        variant === "default"
          ? "secondary"
          : variant === "success"
            ? "secondary"
            : variant === "warning"
              ? "outline"
              : variant
      }
      className="text-xs"
    >
      {label}
    </Badge>
    <span className="text-sm font-medium">
      {typeof value === "number" && value > 100 ? formatCurrency(value) : value}
    </span>
    {change !== undefined && (
      <span
        className={`text-xs ${
          change > 0
            ? "text-green-600 dark:text-green-400"
            : change < 0
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
        }`}
      >
        {change > 0 ? "+" : ""}
        {change}%
      </span>
    )}
  </div>
);

// Divider component
export const SectionDivider: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`border-b-2 border-border/50 ${className}`} />
);
