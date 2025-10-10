import { MetricCard } from "./MetricCard";

interface MetricsCategoryProps {
  category: string;
  metrics: any[];
  gridCols: string;
  compact?: boolean;
}

export function MetricsCategory({
  category,
  metrics,
  gridCols,
  compact = false,
}: MetricsCategoryProps) {
  if (metrics.length === 0) return null;

  return (
    <section>
      {category && (
        <h2 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-[#F4603E]/20 to-transparent" />
          <span>{category}</span>
          <span className="h-px flex-1 bg-gradient-to-l from-[#F4603E]/20 to-transparent" />
        </h2>
      )}
      <div className={`grid gap-3 ${gridCols}`}>
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} metric={metric} compact={compact} />
        ))}
      </div>
    </section>
  );
}
