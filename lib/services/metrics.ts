/**
 * Metrics data fetching service
 */

interface ApiResponse {
  metrics: any;
  tableData: any[];
  dataSource: string;
}

/**
 * Fetch comprehensive metrics data from the API
 */
export async function getMetricsData(): Promise<ApiResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/metrics/comprehensive`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    // Return empty data structure on error
    return {
      metrics: {},
      tableData: [],
      dataSource: "error",
    };
  }
}
