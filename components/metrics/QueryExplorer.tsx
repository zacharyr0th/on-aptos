"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Code, Database, ExternalLink } from "lucide-react";

const DUNE_QUERIES = {
  "Max TPS Analysis": {
    id: 4045024,
    description: "Calculates maximum transactions per second over 15-block windows",
    sql: `-- Daily max Aptos TPS last 30d
WITH bmt AS (
  SELECT
    time AS block_timestamp,
    block_date,
    block_height,
    first_version,
    last_version
  FROM aptos.blocks
  WHERE block_date BETWEEN CURRENT_DATE - INTERVAL '32' DAY
    AND CURRENT_DATE
)
SELECT
  MAX(user_transactions / time_diff) AS max_tps_15_blocks
FROM (
  SELECT
    a.last_version - c.last_version - 32 AS user_transactions,
    EXTRACT(EPOCH FROM (a.block_timestamp - c.block_timestamp)) AS time_diff
  FROM bmt a
  INNER JOIN bmt b ON a.block_height = b.block_height + 15
  INNER JOIN bmt c ON b.block_height = c.block_height + 1
) final`,
  },
  "Hourly Activity Patterns": {
    id: 5699668,
    description: "Tracks transaction volume, users, and gas consumption by hour",
    sql: `-- Hourly transaction patterns with user activity
SELECT
  EXTRACT(HOUR FROM block_timestamp) AS hour,
  COUNT(*) AS transactions,
  COUNT(DISTINCT sender) AS users,
  SUM(gas_used * gas_unit_price) / 1e8 AS gas,
  COUNT(CASE WHEN success = false THEN 1 END) AS failed_transactions
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '1' DAY
GROUP BY 1
ORDER BY 1`,
  },
  "Protocol Activity Overview": {
    id: 5699127,
    description: "Core network metrics including transactions, users, and success rates",
    sql: `-- Core network metrics
SELECT
  COUNT(*) AS total_transactions,
  COUNT(DISTINCT sender) AS unique_senders,
  AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100 AS success_rate,
  AVG(gas_used * gas_unit_price) / 1e8 AS avg_gas_cost
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '30' DAY`,
  },
  "Daily Active Users": {
    id: 3431742,
    description: "Measures daily active addresses and transaction count",
    sql: `-- Daily metrics for the last 24 hours
SELECT
  COUNT(DISTINCT sender) AS daily_active_addresses,
  COUNT(*) AS daily_transactions
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '1' DAY`,
  },
  "Gas Fee Analytics": {
    id: 4045225,
    description: "Analyzes gas fees in both APT and USD",
    sql: `-- Gas fees in APT and USD
SELECT
  SUM(gas_used * gas_unit_price) / 1e8 AS gas_fee_apt,
  SUM(gas_used * gas_unit_price * apt_price_usd) / 1e8 AS gas_fee_usd
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '1' DAY`,
  },
};

export function QueryExplorer() {
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

  const toggleQuery = (queryName: string) => {
    setExpandedQuery(expandedQuery === queryName ? null : queryName);
  };

  return (
    <div className="bg-gradient-to-br from-[#FEEFEC] to-white dark:from-[#1E1870]/5 dark:to-card border-2 border-[#F4603E]/20 rounded-lg p-5 space-y-4 shadow-sm">
      {/* Dune Branding Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-[#F4603E]/20">
        <img src="/Dune-IconLarge.png" alt="Dune" className="w-8 h-8" />
        <div>
          <div className="text-sm font-bold text-[#F4603E]">Dune Analytics</div>
          <div className="text-[10px] text-muted-foreground font-mono">Blockchain data, query ready.</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Database className="w-5 h-5 text-[#F4603E] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold mb-1">How It Works</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Query Aptos data using SQL tables like{" "}
            <code className="text-[10px] bg-[#1E1870]/10 px-1 py-0.5 rounded font-mono">
              aptos.transactions
            </code>{" "}
            and{" "}
            <code className="text-[10px] bg-[#1E1870]/10 px-1 py-0.5 rounded font-mono">
              aptos.blocks
            </code>
            .
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-[#F4603E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-semibold text-[#F4603E]">1</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-foreground">Index:</strong> Blockchain data is continuously indexed into SQL tables
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-[#1E1870]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-semibold text-[#1E1870]">2</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-foreground">Query:</strong> SQL aggregates and analyzes data to generate metrics
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-[#F4603E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-semibold text-[#F4603E]">3</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-foreground">Display:</strong> Results render as cards and charts
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F4603E]/20" />

      {/* Query List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-[#F4603E]" />
          <h4 className="text-xs font-semibold">Example Queries</h4>
        </div>
        <div className="space-y-2">
          {Object.entries(DUNE_QUERIES).map(([queryName, query]) => (
            <div key={queryName} className="border border-border rounded-lg overflow-hidden">
              {/* Query Header */}
              <button
                onClick={() => toggleQuery(queryName)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-0.5">{queryName}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {query.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <a
                    href={`https://dune.com/queries/${query.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F4603E] hover:text-[#F4603E]/80 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {expandedQuery === queryName ? (
                    <ChevronDown className="w-4 h-4 text-[#F4603E]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Query SQL (Expandable) */}
              {expandedQuery === queryName && (
                <div className="p-3 bg-muted/30 border-t border-border">
                  <pre className="text-[9px] overflow-x-auto">
                    <code className="text-muted-foreground">{query.sql}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-[#F4603E]/20">
        <a
          href="https://dune.com/browse/dashboards?q=aptos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#F4603E] hover:text-[#F4603E]/80 transition-colors inline-flex items-center gap-1 font-medium"
        >
          Explore Aptos dashboards
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
