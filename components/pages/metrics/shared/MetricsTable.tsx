"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricsLoadingSkeleton } from "./MetricsLoadingSkeleton";

interface MetricsTableColumn {
  key: string;
  label: string;
  className?: string;
}

interface MetricsTableRow {
  [key: string]: any;
}

interface MetricsTableProps {
  columns: MetricsTableColumn[];
  data: MetricsTableRow[];
  isLoading?: boolean;
  maxHeight?: string;
  onRetry?: () => void;
  retryLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  renderCell?: (key: string, value: any, row: MetricsTableRow) => React.ReactNode;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({
  columns,
  data,
  isLoading = false,
  maxHeight = "800px",
  onRetry,
  retryLabel = "Retry Loading Data",
  emptyTitle = "No data available",
  emptyDescription = "Unable to load data from any source",
  renderCell,
}) => {
  if (isLoading) {
    return <MetricsLoadingSkeleton rows={20} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground mb-4">{emptyDescription}</p>
        {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
      </div>
    );
  }

  return (
    <div className={`max-h-[${maxHeight}] overflow-auto`}>
      <Table>
        <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 border-b">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={`font-semibold ${column.className || ""}`}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {renderCell ? renderCell(column.key, row[column.key], row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
