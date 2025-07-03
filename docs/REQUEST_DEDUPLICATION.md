# Request Deduplication

This project implements request deduplication to prevent duplicate concurrent API requests, improving performance and reducing unnecessary load on external services.

## Overview

Request deduplication automatically prevents identical requests from being made simultaneously. When multiple components or functions try to make the same request at the same time, only one actual request is made, and all callers receive the same response.

## Features

- **Automatic deduplication**: Identical requests are automatically deduplicated based on URL, method, headers, and body
- **Memory efficient**: Automatic cleanup prevents memory leaks with a configurable cache size limit
- **Type-safe**: Full TypeScript support with proper type inference
- **Framework agnostic**: Works with any HTTP client or async function
- **Configurable TTL**: Request timeouts to prevent hanging requests
- **Statistics**: Built-in monitoring and stats for debugging

## How It Works

The deduplication system creates unique keys for requests based on:

- HTTP method (GET, POST, etc.)
- URL
- Request body (for POST/PUT requests)
- Headers

Identical requests share the same key and return the same Promise, ensuring only one actual network request is made.

## Integration Points

### 1. tRPC Client (Automatic)

Request deduplication is automatically enabled for all tRPC queries through the enhanced fetch client:

```typescript
// This is already configured in TRPCProvider.tsx
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      fetch: async (input, init) => {
        return dedupeFetch(input.toString(), init);
      },
    }),
  ],
});
```

### 2. Enhanced Fetch Utility (Automatic)

All GET requests using `enhancedFetch` are automatically deduplicated:

```typescript
import { enhancedFetch } from '@/lib/utils/fetch-utils';

// Automatically deduplicated for GET requests
const response = await enhancedFetch('/api/data');
```

### 3. Manual Usage

For custom API calls or other async operations:

```typescript
import {
  dedupeFetch,
  dedupeAsyncCall,
  withDeduplication,
} from '@/lib/utils/request-deduplication';

// Deduplicate fetch requests
const response = await dedupeFetch('https://api.example.com/data');

// Deduplicate any async function
const result = await dedupeAsyncCall('unique-key', async () => {
  return await expensiveOperation();
});

// Create a deduplicated version of a function
const getUserProfile = withDeduplication(
  async (userId: string) => {
    return await api.getUser(userId);
  },
  (userId: string) => `user-profile-${userId}`
);
```

## Examples

### Basic Fetch Deduplication

```typescript
// Multiple components making the same request
const component1Promise = dedupeFetch('/api/user/123');
const component2Promise = dedupeFetch('/api/user/123');
const component3Promise = dedupeFetch('/api/user/123');

// Only one actual HTTP request is made
// All three promises resolve to the same response
```

### API Endpoint Deduplication

```typescript
import { createDedupedEndpoint } from '@/lib/utils/request-deduplication';

// Create a deduplicated version of an API call
const getTokenPrice = createDedupedEndpoint(
  async (tokenId: string) => {
    const response = await fetch(`/api/tokens/${tokenId}/price`);
    return response.json();
  },
  (tokenId: string) => `token-price-${tokenId}`,
  10000 // 10 second TTL
);

// Multiple calls to the same token are deduplicated
const btcPrice1 = getTokenPrice('bitcoin');
const btcPrice2 = getTokenPrice('bitcoin'); // Uses same request as btcPrice1
const ethPrice = getTokenPrice('ethereum'); // New request
```

### tRPC Query Deduplication

```typescript
// These queries are automatically deduplicated
const query1 = trpc.prices.getBitcoinPrice.useQuery();
const query2 = trpc.prices.getBitcoinPrice.useQuery(); // Same query, deduplicated
```

## Configuration

### Global Settings

The request deduplicator can be configured globally:

```typescript
import { requestDeduplicator } from '@/lib/utils/request-deduplication';

// Clear all pending requests (useful for testing)
requestDeduplicator.clear();

// Get statistics
const stats = requestDeduplicator.getStats();
console.log(`Pending: ${stats.pendingRequests}, Total: ${stats.totalRequests}`);
```

### Custom TTL

Set custom timeouts for specific operations:

```typescript
// 5 second timeout
const result = await dedupeAsyncCall('key', asyncFn, 5000);

// 30 second timeout for slow operations
const slowResult = await dedupeAsyncCall('slow-key', slowAsyncFn, 30000);
```

## When Deduplication Occurs

✅ **Deduplicated:**

- GET requests with identical URLs and headers
- Identical async function calls with the same key
- tRPC queries with the same parameters

❌ **Not Deduplicated:**

- POST, PUT, DELETE requests (mutations should not be deduplicated)
- Requests with different URLs, headers, or body content
- Requests made after the previous request completes
- Async calls with different keys

## Best Practices

1. **Use for read operations**: Only deduplicate GET requests and read-only operations
2. **Avoid for mutations**: Don't deduplicate POST, PUT, DELETE operations
3. **Choose good keys**: Use descriptive, unique keys for async call deduplication
4. **Set appropriate TTLs**: Use shorter TTLs for real-time data, longer for static content
5. **Monitor performance**: Use the stats API to monitor deduplication effectiveness

## Testing

Request deduplication is fully tested with unit tests:

```bash
# Run deduplication tests
npm test tests/utils/request-deduplication.test.ts
```

## Monitoring

Monitor deduplication effectiveness in production:

```typescript
import { requestDeduplicator } from '@/lib/utils/request-deduplication';

// Add to your monitoring/analytics
setInterval(() => {
  const stats = requestDeduplicator.getStats();
  analytics.track('request_deduplication_stats', stats);
}, 60000); // Every minute
```

## Common Issues

### Memory Leaks

The deduplicator automatically cleans up old requests when the cache gets too large (default: 1000 requests).

### Stale Data

Use appropriate cache TTLs and React Query's `staleTime` to balance performance with data freshness.

### Testing

Clear the deduplicator between tests:

```typescript
import { requestDeduplicator } from '@/lib/utils/request-deduplication';

beforeEach(() => {
  requestDeduplicator.clear();
});
```
