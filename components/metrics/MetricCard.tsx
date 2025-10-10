import { shortenMetricName } from "@/lib/utils/metrics";
import { TrendingUp, ExternalLink } from "lucide-react";

interface MetricCardProps {
  metric: {
    name: string;
    value: string;
    secondaryValue?: string;
    queryUrl?: string;
  };
  compact?: boolean;
}

export function MetricCard({ metric, compact = false }: MetricCardProps) {
  return (
    <div
      className={`relative bg-gradient-to-br from-white to-[#FEEFEC]/30 dark:from-card dark:to-[#1E1870]/5
        border-2 border-[#F4603E]/10 hover:border-[#F4603E]/40
        rounded-xl shadow-sm hover:shadow-md
        transition-all duration-300 group overflow-hidden
        ${compact ? "p-2.5" : "p-4"}`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4603E]/0 via-transparent to-[#1E1870]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0 pr-2">
            <div className={`text-muted-foreground/80 font-semibold tracking-tight leading-tight ${compact ? "text-[10px]" : "text-xs"}`}>
              {shortenMetricName(metric.name)}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className={`rounded-lg bg-gradient-to-br from-[#F4603E]/10 to-[#1E1870]/10 flex items-center justify-center ${compact ? "w-5 h-5" : "w-6 h-6"}`}>
              <TrendingUp className={`text-[#F4603E] ${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
            </div>
          </div>
        </div>

        {/* Value */}
        <div className={`font-bold bg-gradient-to-br from-[#1E1870] to-[#F4603E] bg-clip-text text-transparent leading-none ${compact ? "text-lg mb-1.5" : "text-xl mb-2"}`}>
          {metric.value}
        </div>

        {/* Secondary Value (if present) */}
        {metric.secondaryValue && (
          <div className={`font-semibold text-muted-foreground/70 leading-none ${compact ? "text-sm mb-1.5" : "text-base mb-2"}`}>
            {metric.secondaryValue}
          </div>
        )}

        {/* Query link */}
        {metric.queryUrl && (
          <a
            href={metric.queryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-[#F4603E] hover:text-[#1E1870]
              font-medium transition-all duration-200
              opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
              ${compact ? "text-[9px]" : "text-[10px]"}`}
          >
            <span>View Query</span>
            <ExternalLink className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
          </a>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-[#F4603E]/5 to-transparent rounded-bl-full opacity-50" />
    </div>
  );
}
