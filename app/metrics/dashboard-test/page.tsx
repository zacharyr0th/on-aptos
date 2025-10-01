"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/utils/core/logger";

export default function MetricsDashboardTest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/metrics/comprehensive-v2?theme=all&refresh=false");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
        logger.info("Data loaded successfully", result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        logger.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Metrics Dashboard Test</h1>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}