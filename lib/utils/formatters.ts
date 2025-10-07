/**
 * Format a number into a compact, human-readable string
 * @param value - The number to format (can be number or string)
 * @returns Formatted string (e.g., "1.5M", "23.4K", "—" for invalid values)
 */
export function formatCompactNumber(value: number | string | undefined | null): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!num || isNaN(num) || num === 0) return "—";
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}
