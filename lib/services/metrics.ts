/**
 * Metrics data fetching service
 */

interface ApiResponse {
  metrics: any;
  tableData: any[];
  dataSource: string;
}

/**
 * Fetch comprehensive metrics data
 * When called server-side (SSR), directly imports and calls the API logic
 * When called client-side, fetches from the API endpoint
 */
export async function getMetricsData(): Promise<ApiResponse> {
  const isServer = typeof window === 'undefined';

  // Server-side: Import and call the API logic directly to avoid self-fetching
  if (isServer) {
    try {
      console.log('[metrics.ts] Server-side: importing API logic directly');

      // Dynamically import the API route handler
      const { GET } = await import('@/app/api/metrics/comprehensive/route');
      const response = await GET();
      const data = await response.json();

      console.log('[metrics.ts] Server-side: successfully fetched metrics data');
      return data;
    } catch (error) {
      console.error('[metrics.ts] Server-side error:', error);
      return {
        metrics: {},
        tableData: [],
        dataSource: "error",
      };
    }
  }

  // Client-side: Use fetch to call the API endpoint
  try {
    console.log('[metrics.ts] Client-side: fetching from API');

    const response = await fetch('/api/metrics/comprehensive', {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('[metrics.ts] Client-side fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[metrics.ts] Client-side: successfully fetched metrics data');
    return data;
  } catch (error) {
    console.error('[metrics.ts] Client-side error:', error);
    return {
      metrics: {},
      tableData: [],
      dataSource: "error",
    };
  }
}
