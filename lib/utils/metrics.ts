/**
 * Metrics utility functions for data transformation and formatting
 */

/**
 * Shorten metric names for compact card display
 */
export function shortenMetricName(name: string): string {
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
}

/**
 * Categorize metrics into organized sections
 */
export function categorizeMetrics(tableData: any[]) {
  const categories = {
    "Network Activity": [] as any[],
    "Network Performance": [] as any[],
    "Gas Economics": [] as any[],
    "DEX Analytics": [] as any[],
    "Protocol Analytics": [] as any[],
  };

  tableData.forEach((metric) => {
    let category = metric.category || "Network Activity";

    // Merge User Activity into Network Activity
    if (category === "User Activity") {
      category = "Network Activity";
    }

    if (categories[category as keyof typeof categories]) {
      categories[category as keyof typeof categories].push(metric);
    }
  });

  return categories;
}
