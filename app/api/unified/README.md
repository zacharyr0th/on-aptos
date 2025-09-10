# Unified API Endpoints

This directory contains consolidated API endpoints that provide unified access to various data sources with consistent patterns for rate limiting, caching, error handling, and CORS support.

## Directory Structure

```
app/api/unified/
├── README.md                    # This file - documentation and patterns
├── index.ts                     # Barrel exports and directory documentation
├── shared.ts                    # Main shared utilities (barrel export)
├── constants.ts                 # External API endpoints and headers
├── utils.ts                     # Helper functions and utilities
├── assets/route.ts              # Unified asset data (stables, BTC, RWA, LST)
├── prices/route.ts              # Unified price data (Panora + Analytics)
├── tvl/route.ts                 # TVL data from DeFiLlama
└── volume/route.ts              # Volume data from DeFiLlama
```

## Existing Endpoints

### `/api/unified/assets`

Aggregates asset supply data from multiple sources:

- **Parameters**: `type` (all|stables|btc|rwa|lst), `metrics` (boolean)
- **Sources**: StablecoinService, BitcoinService, RWAService, LiquidStakingService
- **Cache**: 10 minutes

### `/api/unified/prices`

Unified price data with fallback sources:

- **Parameters**: `tokens` (comma-separated), `source` (auto|panora|analytics)
- **Sources**: Panora API, Aptos Analytics (fallback)
- **Cache**: 5 minutes

### `/api/unified/tvl`

Total Value Locked metrics:

- **Parameters**: `category` (aptos|protocols|stablecoins|volume|yields), `protocol`, `chain`
- **Source**: DeFiLlama API
- **Cache**: 15 minutes

### `/api/unified/volume`

Trading volume data:

- **Parameters**: `source` (aptos|global|dex), `protocol`, `timeframe` (24h|7d|30d)
- **Source**: DeFiLlama API
- **Cache**: 15 minutes

## Patterns for New Unified Endpoints

When creating new unified endpoints, follow these established patterns:

### 1. File Structure Template

```typescript
// /app/api/unified/[new-endpoint]/route.ts
import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";
import { getResponseTimeHeaders, OPTIONS } from "../shared";

// Cache duration (choose appropriate duration)
export const revalidate = 300; // 5 minutes

// Define interfaces for your endpoint
interface YourEndpointResponse {
  data: any;
  source: string;
  timestamp: string;
}

async function unifiedYourEndpointHandler(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  // Extract parameters
  const param1 = searchParams.get("param1") || "default";

  try {
    // Your logic here
    const data = await fetchYourData(param1);

    return successResponse(
      {
        data,
        source: "your-source",
        timestamp: new Date().toISOString(),
      },
      CACHE_DURATIONS.MEDIUM,
      {
        ...getResponseTimeHeaders(startTime),
        "X-Data-Source": "your-source",
        "X-Endpoint": "your-endpoint",
      },
    );
  } catch (error) {
    logger.error("Unified your-endpoint API error", {
      error: error instanceof Error ? error.message : String(error),
      param1,
    });

    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch data",
      500,
    );
  }
}

export const GET = withRateLimit(unifiedYourEndpointHandler, {
  name: "unified-your-endpoint",
  ...RATE_LIMIT_TIERS.STANDARD,
});

export { OPTIONS };
```

### 2. Required Imports

All unified endpoints should include these standard imports:

```typescript
import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";
import { getResponseTimeHeaders, OPTIONS } from "../shared";
```

### 3. Response Headers Standards

All responses should include:

```typescript
{
  ...getResponseTimeHeaders(startTime),
  "X-Data-Source": "source-name",
  "X-Endpoint": "endpoint-name",
  // Optional additional headers based on functionality
}
```

### 4. Error Handling Pattern

```typescript
try {
  // Main logic
} catch (error) {
  logger.error("Unified [endpoint] API error", {
    error: error instanceof Error ? error.message : String(error),
    // Include relevant request parameters
  });

  return errorResponse(
    error instanceof Error ? error.message : "Failed to fetch data",
    500,
  );
}
```

### 5. Cache Duration Guidelines

Choose appropriate cache durations:

- `CACHE_DURATIONS.VERY_SHORT` (60s) - Highly volatile data like live prices
- `CACHE_DURATIONS.SHORT` (120s) - Frequently changing data
- `CACHE_DURATIONS.MEDIUM` (300s) - Standard cache duration (most endpoints)
- `CACHE_DURATIONS.LONG` (600s) - Stable data like token metadata
- `CACHE_DURATIONS.VERY_LONG` (1800s) - Rarely changing data

### 6. Rate Limiting Tiers

- `RATE_LIMIT_TIERS.PUBLIC` - Very permissive (for public data)
- `RATE_LIMIT_TIERS.STANDARD` - Standard limits (most endpoints)
- `RATE_LIMIT_TIERS.STRICT` - Restrictive (for expensive operations)

### 7. Parameter Validation

Use consistent parameter extraction and validation:

```typescript
const { searchParams } = new URL(request.url);
const param1 = searchParams.get("param1") || "default";
const param2 = searchParams.get("param2");

// Validate required parameters
if (!param2) {
  return errorResponse("Missing required parameter: param2", 400);
}
```

### 8. Response Format Standards

All unified endpoints should return consistent response formats:

```typescript
{
  // Main data (endpoint-specific)
  data: any,

  // Metadata (consistent across endpoints)
  source: string,
  timestamp: string,

  // Optional fields based on functionality
  category?: string,
  protocol?: string,
  tokens?: number,
  requested?: number,
}
```

## Shared Utilities

### Constants (`constants.ts`)

- `DEFI_LLAMA_BASE` - DeFiLlama API base URL
- `PANORA_API_ENDPOINT` - Panora API endpoint
- `FETCH_HEADERS` - Standard headers for external API calls
- `CORS_HEADERS` - CORS headers for all unified endpoints

### Utilities (`utils.ts`)

- `fetchFromDeFiLlama(endpoint)` - DeFiLlama API client with error handling
- `extractTokensFromParams(searchParams)` - Extract token addresses from various parameter names
- `getResponseTimeHeaders(startTime)` - Generate response time headers
- `validateTokenAddress(address)` - Basic token address validation
- `normalizeTokenAddresses(tokens)` - Clean and normalize token addresses

### CORS Handler

All unified endpoints export the same `OPTIONS` handler from `shared.ts`.

## Adding New Endpoints

1. **Create the route file** following the template above
2. **Add external API clients** to `constants.ts` if needed
3. **Add utility functions** to `utils.ts` if they'll be reused
4. **Update this README** with the new endpoint documentation
5. **Test the endpoint** with appropriate query parameters
6. **Add to index.ts** if exporting types or utilities

## Performance Considerations

- All endpoints include response time tracking
- Use appropriate cache durations based on data volatility
- Include data source headers for debugging
- Rate limiting is applied to prevent abuse
- Error handling includes proper logging with context

## Backward Compatibility

The unified endpoints are designed to be stable APIs. When making changes:

1. **Additive changes** (new optional parameters) are safe
2. **Breaking changes** require deprecation notices and migration paths
3. **Response format changes** should maintain backward compatibility
4. **Consider creating new endpoint versions** for major changes

## Examples

### Fetching All Assets

```
GET /api/unified/assets?type=all&metrics=true
```

### Fetching Specific Token Prices

```
GET /api/unified/prices?tokens=0x123,0x456&source=auto
```

### Getting Aptos TVL Data

```
GET /api/unified/tvl?category=aptos
```

### Fetching Volume Data

```
GET /api/unified/volume?source=aptos&timeframe=24h
```
