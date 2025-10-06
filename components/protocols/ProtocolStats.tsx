'use client';

import { useDefiLlamaData } from '@/hooks/useDefiLlamaData';

interface ProtocolStatsProps {
  protocolName: string;
  showVolume?: boolean;
  inline?: boolean;
}

export function ProtocolStats({ protocolName, showVolume = true, inline = false }: ProtocolStatsProps) {
  const { data, loading, error } = useDefiLlamaData(protocolName);

  if (loading) {
    if (inline) {
      return <div className="animate-pulse bg-muted rounded h-4 w-16 mt-1" />;
    }
    return (
      <div className="flex gap-3 text-xs mt-3 pt-3 border-t border-border/50">
        <div className="animate-pulse bg-muted rounded h-4 w-20" />
        {showVolume && <div className="animate-pulse bg-muted rounded h-4 w-20" />}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const parseChange = (changeStr?: string) => {
    if (!changeStr) return null;
    const value = parseFloat(changeStr.replace(/[+%]/g, ''));
    return value;
  };

  const tvlChange = parseChange(data.change7d);
  const volumeChange = parseChange(data.volumeChange24h);

  // Inline version (for lending/yield protocols)
  if (inline) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">TVL</span>
        <span className="text-xs font-semibold text-foreground font-mono">{data.tvl}</span>
        {tvlChange !== null && (
          <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded ${
            tvlChange >= 0
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {tvlChange >= 0 ? '+' : ''}{tvlChange.toFixed(1)}%
          </span>
        )}
      </div>
    );
  }

  // Default bordered version (for trading protocols)
  return (
    <div className="flex gap-3 text-xs mt-3 pt-3 border-t border-border/50">
      {/* TVL */}
      <div className="flex-1">
        <p className="text-muted-foreground mb-0.5">TVL</p>
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-foreground font-mono">{data.tvl}</p>
          {tvlChange !== null && (
            <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded ${
              tvlChange >= 0
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {tvlChange >= 0 ? '+' : ''}{tvlChange.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Volume (24h) */}
      {showVolume && data.volume24h && (
        <div className="flex-1">
          <p className="text-muted-foreground mb-0.5">Vol (24h)</p>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground font-mono">{data.volume24h}</p>
            {volumeChange !== null && (
              <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded ${
                volumeChange >= 0
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {volumeChange >= 0 ? '+' : ''}{volumeChange.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
