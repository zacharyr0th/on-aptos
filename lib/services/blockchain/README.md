# Blockchain Services

This directory contains blockchain-specific services for interacting with the Aptos network infrastructure. These services provide high-level abstractions for common blockchain operations with built-in caching, error handling, and performance optimizations.

## Services Overview

### 🏷️ ANS Service (`ans.ts`)

Aptos Name Service integration for domain resolution.

**Features:**

- Domain validation with specific error codes
- Intelligent caching with configurable TTL
- Fallback from ANS API to GraphQL
- Comprehensive error handling and retry logic
- Support for subdomains

**Usage:**

```typescript
import { AnsService } from "@/lib/services/blockchain";

// Basic domain resolution
const result = await AnsService.resolveName("zachtos.apt");
console.log(result.address); // '0x123...'

// With custom options
const result = await AnsService.resolveName("zachtos.apt", {
  useCache: true,
  timeout: 3000,
  fallbackToGraphQL: false,
});

// Domain validation
const isValid = AnsService.isAptDomain("zachtos.apt"); // true
const parsed = AnsService.parseDomain("sub.zachtos.apt");
// { domain: 'zachtos', subdomain: 'sub' }
```

### 📊 Analytics Service (`aptos-analytics.ts`)

Aptos Analytics API integration with advanced features.

**Features:**

- Intelligent caching with configurable TTL
- Exponential backoff retry mechanism
- Request timeout and abort signal support
- Batch request capabilities
- Comprehensive error classification
- Cache management utilities

**Usage:**

```typescript
import { aptosAnalytics } from "@/lib/services/blockchain";

// Get latest token price
const prices = await aptosAnalytics.getTokenLatestPrice({
  address: "0x123...",
});

// Gas usage analysis
const gasData = await aptosAnalytics.getGasUsage(
  {
    gas_payer_address: "0x123...",
    start_unix_secs: 1234567890,
    end_unix_secs: 1234567900,
  },
  {
    timeout: 5000,
    retries: 2,
    useCache: false,
  },
);

// Batch multiple requests
const batchResults = await aptosAnalytics.batchRequest([
  {
    key: "prices",
    endpoint: "/token/latest_price",
    params: { address: "0x123" },
  },
  {
    key: "gas",
    endpoint: "/gas/usage",
    params: { gas_payer_address: "0x456" },
  },
]);

// Cache management
aptosAnalytics.clearCache("token"); // Clear specific pattern
aptosAnalytics.clearCache(); // Clear all analytics cache
const stats = aptosAnalytics.getCacheStats();
```

## Configuration

### Default Settings

```typescript
import { DEFAULT_CONFIG } from "@/lib/services/blockchain";

const config = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3, // Max retry attempts
  RETRY_DELAY: 1000, // Base retry delay (ms)
  CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  CACHE_TTL_LONG: 5 * 60 * 1000, // 5 minutes
};
```

### Custom Configuration

```typescript
// Custom timeout and retries
const result = await aptosAnalytics.getTokenLatestPrice(
  { address: "0x123" },
  { timeout: 5000, retries: 1 },
);

// Disable caching
const result = await AnsService.resolveName("test.apt", { useCache: false });
```

## Error Handling

### ANS Service Errors

```typescript
// Validation errors
type AnsValidationError = {
  code: "INVALID_FORMAT" | "EMPTY_DOMAIN" | "INVALID_CHARACTERS" | "TOO_LONG";
  message: string;
  input: string;
};

// Resolution results always include error info
type AnsResolveResult = {
  address: string | null;
  domain: string;
  subdomain: string | null;
  source: "ans-api" | "graphql";
  cached?: boolean;
  resolvedAt?: number;
};
```

### Analytics Service Errors

The service automatically classifies and handles different error types:

- **Network errors**: Retried with exponential backoff
- **4xx HTTP errors**: Not retried (client errors)
- **5xx HTTP errors**: Retried up to configured limit
- **Timeout errors**: Handled with AbortController

## Performance Optimization

### Caching Strategy

- **ANS Service**: 5-minute TTL for successful resolutions, 1-minute for failures
- **Analytics Service**: Variable TTL based on data volatility
  - Latest prices: 2 minutes
  - Historical data: 5 minutes
  - Gas usage: 5 minutes (less volatile)

### Request Optimization

- **Batch requests**: Combine multiple analytics queries
- **Intelligent retries**: Exponential backoff for transient failures
- **Request deduplication**: Cache prevents duplicate requests
- **Timeout control**: Configurable timeouts with AbortController

## Testing

Comprehensive test suites are available:

```bash
# Run all blockchain service tests
npm test lib/services/blockchain

# Run specific service tests
npm test lib/services/blockchain/ans.test.ts
npm test lib/services/blockchain/aptos-analytics.test.ts
```

### Test Coverage

- ✅ Domain validation and parsing
- ✅ API integration and error handling
- ✅ Caching behavior
- ✅ Retry logic and timeout handling
- ✅ Batch request functionality
- ✅ Edge cases and malformed responses

## Architecture Decisions

### Why Separate Services?

1. **Single Responsibility**: Each service handles one concern
2. **Independent Scaling**: Different caching and retry strategies
3. **Maintainability**: Easier to test and modify in isolation
4. **Flexibility**: Can be used independently or together

### Design Patterns Used

- **Singleton Pattern**: Analytics service instance
- **Static Methods**: ANS service utilities
- **Configuration Object**: Flexible request options
- **Fallback Strategy**: ANS API → GraphQL
- **Circuit Breaker**: Intelligent retry logic

### Dependencies

- `@/lib/utils/core/logger`: Structured logging
- `@/lib/utils/simple-cache`: In-memory caching
- Built-in `fetch`: HTTP requests with AbortController

## Migration Guide

### From Direct API Calls

```typescript
// ❌ Before: Direct fetch calls
const response = await fetch(
  "https://api.mainnet.aptoslabs.com/v1/analytics/token/latest_price?address=0x123",
);
const data = await response.json();

// ✅ After: Using service
const data = await aptosAnalytics.getTokenLatestPrice({ address: "0x123" });
```

### From Basic ANS Integration

```typescript
// ❌ Before: Manual domain parsing
const domain = input.endsWith(".apt") ? input.slice(0, -4) : null;

// ✅ After: Using service
const parsed = AnsService.parseDomain(input);
const isValid = AnsService.isAptDomain(input);
```

## Contributing

### Adding New Methods

1. Add interface definitions in the appropriate file
2. Implement method with proper error handling
3. Add comprehensive tests
4. Update documentation

### Performance Considerations

- Consider appropriate cache TTL for new endpoints
- Implement retry logic for network-dependent operations
- Add timeout configuration for long-running requests
- Profile memory usage for large responses

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc documentation for public methods
- Include usage examples in comments

## Troubleshooting

### Common Issues

**ANS Resolution Failures**

```typescript
// Check if domain format is valid first
if (!AnsService.isAptDomain(domain)) {
  console.log("Invalid domain format");
  return;
}

// Use options for debugging
const result = await AnsService.resolveName(domain, {
  useCache: false, // Bypass cache
  timeout: 10000, // Longer timeout
});
```

**Analytics API Errors**

```typescript
// Disable retries for debugging
const data = await aptosAnalytics.getTokenLatestPrice(
  { address: "0x123" },
  { retries: 0, useCache: false },
);
```

**Cache Issues**

```typescript
// Clear problematic cache entries
AptosAnalyticsService.clearCache("token");

// Check cache statistics
const stats = AptosAnalyticsService.getCacheStats();
console.log("Cache entries:", stats.analytics_entries);
```

### Monitoring

Enable debug logging to monitor service behavior:

```typescript
// The logger will output debug information in development
// Check browser console or server logs for detailed request/response info
```

---

For more information about the broader service architecture, see the main [services documentation](../README.md).
