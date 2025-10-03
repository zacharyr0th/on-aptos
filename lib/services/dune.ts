import { apiLogger } from "@/lib/utils/core/logger";

/**
 * Dune Analytics API Service
 * Handles query execution and result fetching with automatic refresh capability
 */

interface DuneExecutionResponse {
  execution_id: string;
  state: string;
}

interface DuneStatusResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  execution_started_at?: string;
  execution_ended_at?: string;
  expires_at?: string;
}

interface DuneResultResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at?: string;
  execution_started_at?: string;
  execution_ended_at?: string;
  expires_at?: string;
  result?: {
    rows: any[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
      datapoint_count: number;
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
}

export class DuneAnalyticsService {
  private apiKey: string;
  private baseUrl = "https://api.dune.com/api/v1";
  private maxRetries = 30; // Max retries for execution status check
  private retryDelay = 2000; // 2 seconds between retries

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DUNE_API_KEY_TOKEN || "";
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error("Dune API key not configured");
    }
  }

  /**
   * Execute a Dune query programmatically
   */
  async executeQuery(queryId: number, parameters?: Record<string, any>): Promise<string> {
    this.ensureApiKey();
    try {
      apiLogger.info(`Executing Dune query ${queryId}`, { parameters });

      const response = await fetch(`${this.baseUrl}/query/${queryId}/execute`, {
        method: "POST",
        headers: {
          "X-Dune-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: parameters ? JSON.stringify({ query_parameters: parameters }) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Failed to execute query: ${response.status} ${response.statusText}`);
      }

      const data: DuneExecutionResponse = await response.json();
      apiLogger.info(`Query ${queryId} execution started`, { execution_id: data.execution_id });
      
      return data.execution_id;
    } catch (error) {
      apiLogger.error(`Error executing Dune query ${queryId}:`, error);
      throw error;
    }
  }

  /**
   * Check the status of a query execution
   */
  async getExecutionStatus(executionId: string): Promise<DuneStatusResponse> {
    this.ensureApiKey();
    try {
      const response = await fetch(`${this.baseUrl}/execution/${executionId}/status`, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get execution status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      apiLogger.error(`Error getting execution status for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get the results of a completed query execution
   */
  async getExecutionResults(executionId: string): Promise<any[]> {
    this.ensureApiKey();
    try {
      const response = await fetch(`${this.baseUrl}/execution/${executionId}/results`, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get execution results: ${response.status}`);
      }

      const data: DuneResultResponse = await response.json();
      return data.result?.rows || [];
    } catch (error) {
      apiLogger.error(`Error getting execution results for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached results of a query without executing
   */
  async getCachedResults(queryId: number): Promise<any[]> {
    this.ensureApiKey();
    try {
      const response = await fetch(`${this.baseUrl}/query/${queryId}/results`, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get cached results: ${response.status}`);
      }

      const data: DuneResultResponse = await response.json();
      return data.result?.rows || [];
    } catch (error) {
      apiLogger.error(`Error getting cached results for query ${queryId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for a query execution to complete
   */
  private async waitForCompletion(executionId: string): Promise<void> {
    for (let i = 0; i < this.maxRetries; i++) {
      const status = await this.getExecutionStatus(executionId);
      
      if (status.state === "QUERY_STATE_COMPLETED") {
        apiLogger.info(`Query execution ${executionId} completed`);
        return;
      }
      
      if (status.state === "QUERY_STATE_FAILED" || status.state === "QUERY_STATE_CANCELLED") {
        throw new Error(`Query execution failed with state: ${status.state}`);
      }
      
      apiLogger.debug(`Query execution ${executionId} still running (${status.state}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    }
    
    throw new Error(`Query execution timed out after ${this.maxRetries * this.retryDelay / 1000} seconds`);
  }

  /**
   * Refresh a query and get fresh results
   * This combines execute, wait, and get results into one convenient method
   */
  async refresh(queryId: number, parameters?: Record<string, any>): Promise<any[]> {
    try {
      apiLogger.info(`Refreshing Dune query ${queryId}`);
      
      // Execute the query
      const executionId = await this.executeQuery(queryId, parameters);
      
      // Wait for completion
      await this.waitForCompletion(executionId);
      
      // Get the results
      const results = await this.getExecutionResults(executionId);
      
      apiLogger.info(`Successfully refreshed query ${queryId}`, { 
        resultCount: results.length 
      });
      
      return results;
    } catch (error) {
      apiLogger.error(`Error refreshing query ${queryId}:`, error);
      // Fall back to cached results if refresh fails
      apiLogger.info(`Falling back to cached results for query ${queryId}`);
      return this.getCachedResults(queryId);
    }
  }

  /**
   * Get results with smart caching
   * - Uses cached results if they're fresh enough
   * - Otherwise triggers a refresh
   */
  async getSmartResults(
    queryId: number,
    maxAge: number = 300, // Max age in seconds (5 minutes default)
    parameters?: Record<string, any>
  ): Promise<any[]> {
    this.ensureApiKey();
    try {
      // First, try to get cached results to check freshness
      const cachedResponse = await fetch(`${this.baseUrl}/query/${queryId}/results`, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      if (!cachedResponse.ok) {
        // No cached results, must refresh
        return this.refresh(queryId, parameters);
      }

      const cached: DuneResultResponse = await cachedResponse.json();
      
      // Check if execution_ended_at exists and is recent enough
      if (cached.execution_ended_at) {
        const executionTime = new Date(cached.execution_ended_at);
        const ageInSeconds = (Date.now() - executionTime.getTime()) / 1000;
        
        if (ageInSeconds <= maxAge) {
          apiLogger.info(`Using cached results for query ${queryId} (${Math.round(ageInSeconds)}s old)`);
          return cached.result?.rows || [];
        }
      }
      
      // Data is stale, trigger refresh
      apiLogger.info(`Cached data for query ${queryId} is stale, refreshing...`);
      return this.refresh(queryId, parameters);
    } catch (error) {
      apiLogger.error(`Error in getSmartResults for query ${queryId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance for convenience
export const duneService = new DuneAnalyticsService();