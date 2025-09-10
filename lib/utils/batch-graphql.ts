/**
 * GraphQL query batching utility for performance optimization
 */

interface BatchedQuery {
  id: string;
  query: string;
  variables?: Record<string, any>;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
}

class GraphQLBatcher {
  private batchTimeout = 50; // 50ms batch window
  private currentBatch: BatchedQuery[] = [];
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    private endpoint: string,
    private headers: Record<string, string> = {}
  ) {}

  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = Math.random().toString(36).substring(2);

      this.currentBatch.push({
        id,
        query,
        variables,
        resolve: resolve as (data: any) => void,
        reject,
      });

      // Clear existing timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Set timeout to execute batch
      this.timeoutId = setTimeout(() => {
        this.executeBatch();
      }, this.batchTimeout);
    });
  }

  private async executeBatch() {
    if (this.currentBatch.length === 0) return;

    const batch = [...this.currentBatch];
    this.currentBatch = [];
    this.timeoutId = null;

    try {
      if (batch.length === 1) {
        // Single query - execute normally
        const { query, variables, resolve, reject } = batch[0];
        try {
          const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...this.headers,
            },
            body: JSON.stringify({ query, variables }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          if (result.errors) {
            throw new Error(result.errors[0]?.message || "GraphQL Error");
          }

          resolve(result.data);
        } catch (error) {
          reject(error as Error);
        }
        return;
      }

      // Multiple queries - execute as batch
      const batchQuery = batch
        .map(
          (q, index) => `query_${index}: ${q.query.replace(/query[^{]*\{/, "").replace(/}$/, "")}`
        )
        .join("\n");

      const combinedQuery = `query BatchQuery {
        ${batchQuery}
      }`;

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.headers,
        },
        body: JSON.stringify({
          query: combinedQuery,
          // Note: Batched queries with variables are complex - for now we'll keep single queries for those
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.errors) {
        // Handle partial failures
        batch.forEach((q) => q.reject(new Error(result.errors[0]?.message || "GraphQL Error")));
        return;
      }

      // Distribute results back to individual queries
      batch.forEach((q, index) => {
        const queryKey = `query_${index}`;
        if (result.data[queryKey]) {
          q.resolve(result.data[queryKey]);
        } else {
          q.reject(new Error("Query result not found in batch"));
        }
      });
    } catch (error) {
      // Fallback: execute each query individually
      batch.forEach(async (q) => {
        try {
          const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...this.headers,
            },
            body: JSON.stringify({ query: q.query, variables: q.variables }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          if (result.errors) {
            throw new Error(result.errors[0]?.message || "GraphQL Error");
          }

          q.resolve(result.data);
        } catch (err) {
          q.reject(err as Error);
        }
      });
    }
  }
}

// Create singleton instances for common endpoints
const APTOS_MAINNET_ENDPOINT = "https://api.mainnet.aptoslabs.com/v1/graphql";
const headers = {
  Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET || ""}`,
};

export const aptosGraphQLBatcher = new GraphQLBatcher(APTOS_MAINNET_ENDPOINT, headers);

// Convenience function for batched queries
export async function batchedGraphQLQuery<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  return aptosGraphQLBatcher.query<T>(query, variables);
}
