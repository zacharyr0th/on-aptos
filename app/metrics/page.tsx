"use client";

import { GeistMono } from "geist/font/mono";
import { Code2, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logger } from "@/lib/utils/core/logger";
import { formatCompactNumber } from "@/lib/utils/formatters";

// Dune Query IDs with SQL queries
const DUNE_QUERIES = {
  TRANSACTION_ANALYSIS: {
    id: 4045024,
    name: "Max TPS Analysis",
    sql: `-- Daily max Aptos TPS last 30d
-- our target block is b
-- look 15 blocks in the future (a)
-- look 1 block in the past (c)
-- take the difference in version and subtract out 2 non-user txn per block
-- since timestamp is at the granularity of seconds, this calculation will be slightly off
WITH bmt AS (
  SELECT
    time AS block_timestamp,
    block_date,
    block_height,
    first_version,
    last_version
  FROM aptos.blocks
  WHERE block_date BETWEEN CURRENT_DATE - INTERVAL '32' DAY AND CURRENT_DATE
), final AS (
  SELECT
    a.block_timestamp AS block_timestamp,
    a.block_height AS block_height_a,
    b.block_height AS block_height_b,
    c.block_height AS block_height_c,
    a.last_version - c.last_version - (15 + 1) * 2 AS user_transactions,
    EXTRACT(EPOCH FROM (a.block_timestamp - c.block_timestamp)) AS time_diff
  FROM bmt a
  INNER JOIN bmt b ON a.block_height = b.block_height + 15
  INNER JOIN bmt c ON b.block_height = c.block_height + 1
)
SELECT
  MAX(user_transactions / time_diff) AS max_tps_15_blocks
FROM final`
  },
  ACTIVITY_PATTERNS: {
    id: 5699668,
    name: "Hourly Activity Patterns",
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
ORDER BY 1`
  },
  PROTOCOL_ACTIVITY: {
    id: 5699127,
    name: "Protocol Activity Overview",
    sql: `-- Core network metrics
SELECT
  COUNT(*) AS total_transactions,
  COUNT(DISTINCT sender) AS unique_senders,
  AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100 AS success_rate,
  AVG(gas_used * gas_unit_price) / 1e8 AS avg_gas_cost
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '30' DAY`
  },
  DEX_COMPARISON: {
    id: 3431742,
    name: "Daily Active Users & Transactions",
    sql: `-- Daily metrics for the last 24 hours
SELECT
  COUNT(DISTINCT sender) AS daily_active_addresses,
  COUNT(*) AS daily_transactions
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '1' DAY`
  },
  USER_ANALYTICS: {
    id: 4045225,
    name: "Gas Fee Analytics",
    sql: `-- Gas fees in APT and USD
SELECT
  SUM(gas_used * gas_unit_price) / 1e8 AS gas_fee_apt,
  SUM(gas_used * gas_unit_price * apt_price_usd) / 1e8 AS gas_fee_usd
FROM aptos.transactions
WHERE block_timestamp >= CURRENT_DATE - INTERVAL '1' DAY`
  }
};

const getDuneQueryUrl = (queryId: number) => `https://dune.com/queries/${queryId}`;

// Shorten metric names for card display
const shortenMetricName = (name: string): string => {
  const replacements: Record<string, string> = {
    "All-Time Total Transactions": "Total Transactions",
    "Daily Active Addresses (24h)": "Daily Active Addresses",
    "Total Network Signatures": "Total Signatures",
    "Max TPS (15 blocks)": "Max TPS",
    "Transaction Success Rate": "Success Rate",
    "Average Gas Cost (APT)": "Avg Gas Price",
    "Average Block Time": "Block Time",
    "Transaction Finality Time": "Finality Time",
    "Enhanced Network Reliability": "Network Reliability",
    "Daily Gas Fees (24h USD)": "Daily Gas Fees",
    "Total Swap Events": "Swap Events",
    "Unique Traders": "Traders",
    "Peak Hour Transaction Volume": "Peak Hourly Activity",
    "Peak Hour Active Users": "Peak Hour Users",
    "Identified Protocol Activity": "Protocol Activity",
    "Hourly Failed Transactions": "Failed Transactions",
    "Net Daily Gas (24h APT)": "Daily Gas (APT)",
    "Average Hourly Transactions": "Avg Hourly Transactions",
    "Network Age (Days)": "Network Age",
  };

  return replacements[name] || name;
};

interface ApiResponse {
  metrics: any;
  tableData: any[];
  dataSource: string;
}

export default function MetricsPage() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);

  const hourlyChartRef = useRef<SVGSVGElement>(null);
  const protocolChartRef = useRef<SVGSVGElement>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/metrics/comprehensive`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();
      setApiData(result);

      logger.info("Metrics data loaded", {
        activityPatterns: result.metrics?.activityPatterns?.length || 0,
        protocolBreakdown: result.metrics?.protocolBreakdown?.length || 0,
      });
    } catch (err) {
      logger.error("Failed to fetch metrics:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Draw hourly activity chart with D3
  useEffect(() => {
    if (!hourlyChartRef.current || !apiData?.metrics?.activityPatterns) return;

    const rawData = apiData.metrics.activityPatterns.slice(0, 24);
    if (rawData.length === 0) return;

    // Group data into 3-hour slots (8 slots per day)
    const groupedData = [];
    for (let i = 0; i < 24; i += 3) {
      const slotData = rawData.filter((d: any) => {
        const hour = Number(d.hour);
        return !isNaN(hour) && hour >= i && hour < i + 3;
      });

      const totalTransactions = slotData.reduce((sum: number, d: any) => {
        const txCount = Number(d.transactions);
        return sum + (isNaN(txCount) ? 0 : txCount);
      }, 0);

      const slotLabel = `${i}-${i + 3}h`;

      groupedData.push({
        slot: slotLabel,
        transactions: totalTransactions,
        hourRange: `${i}:00 - ${i + 3}:00`
      });
    }

    // If all values are 0, use raw data directly
    if (groupedData.every(d => d.transactions === 0)) {
      // Fall back to individual hours
      for (let i = 0; i < Math.min(24, rawData.length); i++) {
        const hour = rawData[i];
        const txCount = Number(hour?.transactions || 0);
        if (!isNaN(txCount) && txCount > 0) {
          groupedData.length = 0;
          // Use individual hours instead
          rawData.forEach((h: any) => {
            groupedData.push({
              slot: `${h.hour}h`,
              transactions: Number(h.transactions || 0),
              hourRange: `${h.hour}:00`
            });
          });
          break;
        }
      }
    }

    const svg = d3.select(hourlyChartRef.current);
    svg.selectAll("*").remove();

    // Get container width for responsive design
    const containerWidth = hourlyChartRef.current.parentElement?.clientWidth || 800;
    const margin = { top: 40, right: 20, bottom: 60, left: 70 };
    const width = Math.min(containerWidth - margin.left - margin.right, 1200);
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(groupedData.map((d: any) => d.slot))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(groupedData, (d: any) => d.transactions || 0) || 0])
      .nice()
      .range([height, 0]);

    // Add grid lines
    g.append("g")
      .attr("class", "grid opacity-10")
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ""))
      .select(".domain")
      .remove();

    // X axis with proper spacing
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("class", "fill-muted-foreground")
      .style("font-size", "11px")
      .style("text-anchor", "middle");

    // Y axis with formatted values
    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => formatCompactNumber(+d)))
      .selectAll("text")
      .attr("class", "fill-muted-foreground")
      .style("font-size", "11px");

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("class", "fill-muted-foreground")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Transactions");

    // X axis label
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("class", "fill-muted-foreground")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Time Period");

    // Bars with tooltips
    const bars = g.selectAll(".bar")
      .data(groupedData)
      .enter()
      .append("rect")
      .attr("class", "fill-primary opacity-80 hover:opacity-100 transition-opacity cursor-pointer")
      .attr("x", (d: any) => x(d.slot) || 0)
      .attr("y", (d: any) => y(d.transactions || 0))
      .attr("width", x.bandwidth())
      .attr("height", (d: any) => height - y(d.transactions || 0))
      .attr("rx", 2);

    // Chart title
    g.append("text")
      .attr("class", "fill-foreground")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Transaction Activity by Time Period (Last 24h)");

  }, [apiData]);

  // Draw protocol breakdown chart with D3
  useEffect(() => {
    if (!protocolChartRef.current || !apiData?.metrics?.protocolBreakdown) return;

    const data = apiData.metrics.protocolBreakdown.slice(0, 10);
    if (data.length === 0) return;

    const svg = d3.select(protocolChartRef.current);
    svg.selectAll("*").remove();

    // Get container width for responsive design
    const containerWidth = protocolChartRef.current.parentElement?.clientWidth || 800;
    const margin = { top: 40, right: 20, bottom: 120, left: 70 };
    const width = Math.min(containerWidth - margin.left - margin.right, 1200);
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Truncate long protocol names
    const truncateLabel = (name: string, maxLength: number = 15) => {
      return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
    };

    // Scales
    const x = d3.scaleBand()
      .domain(data.map((d: any) => d.protocolName || "Unknown"))
      .range([0, width])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: any) => d.transactionCount || 0) || 0])
      .nice()
      .range([height, 0]);

    // Add grid lines
    g.append("g")
      .attr("class", "grid opacity-10")
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ""))
      .select(".domain")
      .remove();

    // X axis with rotated labels
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => truncateLabel(d as string, 15)))
      .selectAll("text")
      .attr("class", "fill-muted-foreground")
      .style("font-size", "10px")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y axis with formatted values
    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => formatCompactNumber(+d)))
      .selectAll("text")
      .attr("class", "fill-muted-foreground")
      .style("font-size", "11px");

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("class", "fill-muted-foreground")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Transaction Count");

    // X axis label
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 100)
      .attr("class", "fill-muted-foreground")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Protocol");

    // Bars with hover effect
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "opacity-80 hover:opacity-100 transition-opacity cursor-pointer")
      .attr("fill", "var(--accent)")
      .attr("x", (d: any) => x(d.protocolName || "Unknown") || 0)
      .attr("y", (d: any) => y(d.transactionCount || 0))
      .attr("width", x.bandwidth())
      .attr("height", (d: any) => height - y(d.transactionCount || 0))
      .attr("rx", 2);

    // Chart title
    g.append("text")
      .attr("class", "fill-foreground")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Top Protocols by Transaction Volume");

  }, [apiData]);

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen textured-bg p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen textured-bg p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Error Loading Dashboard</h2>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Button onClick={() => fetchData()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!apiData) return null;

  const metrics = apiData.metrics || {};

  return (
    <ErrorBoundary>
      <div className={`min-h-screen textured-bg ${GeistMono.className}`}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-4 pb-6 space-y-4">

          {/* All Metrics Grid - Show all available metrics from tableData */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {apiData.tableData && apiData.tableData.map((row: any, idx: number) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="text-muted-foreground text-xs font-normal mb-2">
                  {shortenMetricName(row.name)}
                </div>
                <div className="text-2xl font-normal text-foreground mb-2">
                  {row.value}
                </div>
                {row.queryUrl && (
                  <a
                    href={row.queryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2BD4A5] hover:text-[#2BD4A5]/80 text-xs font-normal inline-flex items-center gap-1 transition-colors"
                  >
                    View Query →
                  </a>
                )}
              </div>
            ))}

            {/* Additional Lorem Ipsum Cards */}
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
              <div className="text-muted-foreground text-xs font-normal mb-2">
                Lorem Ipsum
              </div>
              <div className="text-2xl font-normal text-foreground mb-2">
                Lorem Ipsum
              </div>
              <div className="text-[#2BD4A5] text-xs font-normal">
                View Query →
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
              <div className="text-muted-foreground text-xs font-normal mb-2">
                Lorem Ipsum
              </div>
              <div className="text-2xl font-normal text-foreground mb-2">
                Lorem Ipsum
              </div>
              <div className="text-[#2BD4A5] text-xs font-normal">
                View Query →
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
              <div className="text-muted-foreground text-xs font-normal mb-2">
                Lorem Ipsum
              </div>
              <div className="text-2xl font-normal text-foreground mb-2">
                Lorem Ipsum
              </div>
              <div className="text-[#2BD4A5] text-xs font-normal">
                View Query →
              </div>
            </div>
          </div>

          {/* D3 Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Hourly Activity Chart */}
            {metrics.activityPatterns && metrics.activityPatterns.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Network Activity Patterns</h3>
                </div>
                <div className="overflow-x-auto">
                  <svg ref={hourlyChartRef}></svg>
                </div>
              </div>
            )}

            {/* Protocol Breakdown Chart */}
            {metrics.protocolBreakdown && metrics.protocolBreakdown.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-accent" />
                  <h3 className="text-sm font-semibold">Protocol Activity Distribution</h3>
                </div>
                <div className="overflow-x-auto">
                  <svg ref={protocolChartRef}></svg>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </ErrorBoundary>
  );
}
