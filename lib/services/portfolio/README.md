# Portfolio Services Architecture

## Overview

The portfolio services have been refactored to follow a modular, well-structured architecture that separates concerns and improves maintainability.

## Directory Structure

````
portfolio/
├── services/              # Core service modules
│   ├── asset-service.ts   # Fungible asset operations
│   ├── nft-service.ts     # NFT operations
│   ├── transaction-service.ts # Transaction history
│   ├── defi-service.ts    # DeFi position tracking
│   ├── metrics-service.ts # Portfolio metrics calculation
│   ├── portfolio-history-service.ts # Historical data
│   └── price-service.ts   # Price data aggregation
├── utils/                 # Shared utilities
│   ├── graphql-helpers.ts # GraphQL query execution
│   ├── decimal-converter.ts # Number formatting
│   ├── asset-validators.ts # Asset validation
│   └── price-aggregator.ts # Price caching and aggregation
├── types/                 # TypeScript type definitions
│   └── index.ts          # All shared types
├── constants/             # Constants and configuration
│   └── index.ts          # Service constants
├── portfolio-service.ts   # Main orchestrator (backward compatible)
├── defi-balance-service.ts # DeFi balance calculations
├── panora-service.ts      # Panora API integration
└── phantom-detection.ts   # Phantom asset detection

## Service Pattern

All services follow a consistent static class pattern:

```typescript
export class ServiceName {
  static async method(params: Type): Promise<ReturnType> {
    // Implementation
  }
}
````

## Usage

### Direct Service Import (Recommended)

```typescript
import { AssetService } from "@/lib/services/blockchain/portfolio/services/asset-service";

const assets = await AssetService.getWalletAssets(address);
```

### Legacy Import (Backward Compatible)

```typescript
import { getWalletAssets } from "@/lib/services/blockchain/portfolio/portfolio-service";

const assets = await getWalletAssets(address);
```

## Key Features

1. **Modular Architecture** - Each service handles a specific domain
2. **Shared Utilities** - Common operations are extracted to utils
3. **Type Safety** - All types are centralized in types/index.ts
4. **Consistent Patterns** - All services use static methods
5. **Backward Compatibility** - portfolio-service.ts re-exports for legacy code

## Service Responsibilities

- **AssetService**: Fungible token operations, price fetching, verification
- **NFTService**: NFT fetching, transfer history
- **TransactionService**: Transaction history and activities
- **DeFiService**: DeFi position tracking and metrics
- **MetricsService**: Portfolio value calculations and analytics
- **PortfolioHistoryService**: Historical portfolio reconstruction
- **PriceService**: Price data aggregation from multiple sources

## Performance Optimizations

- LRU caching in PriceAggregator
- Batch price fetching to reduce API calls
- Parallel data fetching where possible
- GraphQL query optimization
