import { createSortableColumn } from "./table-utils";
import type { TableColumn } from "@/lib/types/ui";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";

export const ASSET_TABLE_COLUMNS: TableColumn[] = [
  createSortableColumn("symbol", "Ticker", { width: "30%" }),
  createSortableColumn("balance", "Quantity", {
    width: "15%",
    align: "right",
    render: (value, row) => formatTokenAmount(value, row.decimals),
  }),
  createSortableColumn("price", "Price", {
    width: "15%",
    align: "right",
    render: (value) => (value ? formatCurrency(value) : "—"),
  }),
  createSortableColumn("value", "Value", {
    width: "15%",
    align: "right",
    render: (value) => (value ? formatCurrency(value) : "—"),
  }),
  createSortableColumn("change24h", "24h", {
    width: "12.5%",
    align: "right",
    render: (value) =>
      value ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%` : "—",
  }),
  createSortableColumn("change7d", "7d", {
    width: "12.5%",
    align: "right",
    render: (value) =>
      value ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%` : "—",
  }),
];

export const DEFI_TABLE_COLUMNS: TableColumn[] = [
  createSortableColumn("protocol", "Protocol", { width: "35%" }),
  createSortableColumn("type", "Type", {
    width: "20%",
    render: (value) => {
      if (!value) return "Unknown";
      if (value === "derivatives") return "Perps";
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  }),
  createSortableColumn("value", "Value", {
    width: "15%",
    align: "right",
    render: (value) => formatCurrency(value || 0),
  }),
  createSortableColumn("change24h", "24h", {
    width: "15%",
    align: "right",
    render: (value) =>
      value ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%` : "—",
  }),
  createSortableColumn("change7d", "7d", {
    width: "15%",
    align: "right",
    render: (value) =>
      value ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%` : "—",
  }),
];

export const TRANSACTION_TABLE_COLUMNS: TableColumn[] = [
  createSortableColumn("timestamp", "Time", {
    width: "15%",
    render: (value) => new Date(value).toLocaleString(),
  }),
  createSortableColumn("type", "Type", { width: "15%" }),
  createSortableColumn("amount", "Amount", {
    width: "20%",
    align: "right",
    render: (value, row) => formatTokenAmount(value, row.decimals),
  }),
  createSortableColumn("value", "Value", {
    width: "15%",
    align: "right",
    render: (value) => (value ? formatCurrency(value) : "—"),
  }),
  createSortableColumn("status", "Status", {
    width: "10%",
    render: (value) => (value === "success" ? "✓" : "✗"),
  }),
];

export const TABLE_DEFAULTS = {
  pageSize: 50,
  loadMoreIncrement: 100,
  scrollLoadThreshold: 0.8,
  mobileBreakpoint: 768,
  loadingDelay: 300,
};
