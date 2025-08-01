# Migration Guide: DeFi Position Scanning

This guide helps you migrate from the old `DeFiBalanceService` to the new provider/adapter architecture.

## Overview of Changes

### Old Architecture

- Monolithic `DeFiBalanceService` class
- Protocol-specific logic mixed together
- Hard to extend and maintain
- Limited error handling and retry logic

### New Architecture

- **DeFiPositionProvider**: Main orchestrator
- **ProtocolAdapters**: Individual adapters for each protocol
- **AdapterRegistry**: Manages adapter lifecycle
- **PositionAggregator**: Handles deduplication and aggregation
- Pluggable, testable, and extensible

## Migration Steps

### 1. Replace Service Import

**Before:**

```typescript
import { DeFiBalanceService } from "@/lib/services/portfolio/defi-balance-service";
```

**After:**

```typescript
import { createDeFiProvider } from "@/lib/services/defi";
```

### 2. Update Position Scanning

**Before:**

```typescript
const positions = await DeFiBalanceService.getDeFiPositions(walletAddress);
const stats = await DeFiBalanceService.getDeFiStats(walletAddress);
```

**After:**

```typescript
const provider = createDeFiProvider({
  apiKey: process.env.APTOS_BUILD_SECRET,
});

await provider.initializeAllAdapters();

const result = await provider.scanPositions(walletAddress);
const positions = result.positions;
const stats = result.summary;
```

### 3. Convert DeFi Service Class

**Before (lib/services/portfolio/services/defi-service.ts):**

```typescript
export class DeFiService {
  static async getWalletDeFiPositions(
    address: string,
  ): Promise<DeFiPosition[]> {
    const rawPositions = await DeFiBalanceService.getDeFiPositions(address);
    return rawPositions.map((pos) => this.convertPosition(pos));
  }
}
```

**After:**

```typescript
import { createDeFiProvider, type DeFiPosition } from "@/lib/services/defi";

export class DeFiService {
  private static provider = createDeFiProvider({
    apiKey: process.env.APTOS_BUILD_SECRET,
  });

  static async getWalletDeFiPositions(
    address: string,
  ): Promise<DeFiPosition[]> {
    await this.provider.initializeAllAdapters();
    const result = await this.provider.scanPositions(address);
    return result.positions; // Already in correct format
  }

  static async calculateDeFiMetrics(positions: DeFiPosition[]) {
    // Use the summary from aggregated results
    const result = await this.provider.scanPositions(address);
    return {
      totalValueLocked: result.summary.totalValueUSD,
      totalSupplied: result.summary.totalValueUSD, // Adjust based on your needs
      totalBorrowed: 0, // Calculate from borrowed assets
      netAPY: 0, // Calculate weighted APY
      protocols: Object.keys(result.summary.protocolBreakdown),
    };
  }
}
```

### 4. Update API Routes

**Before (app/api/portfolio/defi/route.ts):**

```typescript
import { DeFiBalanceService } from "@/lib/services/portfolio/defi-balance-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  const positions = await DeFiBalanceService.getDeFiPositions(address);

  return NextResponse.json(positions);
}
```

**After:**

```typescript
import { createDeFiProvider } from "@/lib/services/defi";

const defiProvider = createDeFiProvider({
  apiKey: process.env.APTOS_BUILD_SECRET,
});

// Initialize once at module level
defiProvider.initializeAllAdapters();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  const result = await defiProvider.scanPositions(address, {
    minValueUSD: 0.1,
    parallel: true,
  });

  return NextResponse.json({
    positions: result.positions,
    summary: result.summary,
    metadata: result.metadata,
  });
}
```

## Type Changes

### Position Structure

**Old Type:**

```typescript
interface DeFiPosition {
  protocol: string;
  protocolLabel: string;
  protocolType: ProtocolType;
  address: string;
  position: {
    supplied?: Array<{
      asset: string;
      symbol: string;
      amount: string;
      value?: number;
    }>;
    borrowed?: Array<{
      asset: string;
      symbol: string;
      amount: string;
      value?: number;
    }>;
    liquidity?: Array<{
      poolId: string;
      token0: any;
      token1: any;
      lpTokens: string;
      value?: number;
    }>;
    staked?: Array<{
      asset: string;
      symbol: string;
      amount: string;
      rewards?: string;
      value?: number;
    }>;
  };
  totalValue: number;
}
```

**New Type:**

```typescript
interface DeFiPosition {
  id: string;
  protocol: string;
  protocolType: ProtocolType;
  positionType: PositionType;
  address: string;
  assets: DeFiAsset[];
  totalValueUSD: number;
  metadata?: Record<string, unknown>;
  lastUpdated: string;
}

interface DeFiAsset {
  type: AssetType;
  tokenAddress: string;
  symbol: string;
  amount: string;
  valueUSD: number;
  metadata?: {
    poolId?: string;
    poolTokens?: string[];
    apy?: number;
    rewards?: string;
    underlying?: string[];
  };
}
```

## Feature Enhancements

### 1. Health Monitoring

```typescript
const health = provider.getProviderHealth();
console.log("System health:", health.status);
```

### 2. Selective Adapter Usage

```typescript
// Only use specific adapters
const result = await provider.scanPositions(address, {
  adapters: ["thala-adapter"],
});
```

### 3. Custom Configuration

```typescript
provider.updateAdapterConfig("thala-adapter", {
  timeout: 30000,
  priority: 95,
});
```

### 4. Better Error Handling

```typescript
try {
  const result = await provider.scanPositions(address);
} catch (error) {
  // Individual adapter failures don't crash the entire scan
  console.error("Scan failed:", error);
}
```

## Testing Updates

**Before:**

```typescript
import { DeFiBalanceService } from "@/lib/services/portfolio/defi-balance-service";

// Test was tightly coupled to implementation
const positions = await DeFiBalanceService.getDeFiPositions(testAddress);
```

**After:**

```typescript
import { ThalaAdapter, GenericTokenAdapter } from "@/lib/services/defi";

// Test individual adapters
const thalaAdapter = new ThalaAdapter();
await thalaAdapter.initialize(defaultConfig);
const thalaPositions = await thalaAdapter.scanPositions(testAddress);

// Test full provider
const provider = createDeFiProvider({ enabledAdapters: ["thala-adapter"] });
const result = await provider.scanPositions(testAddress);
```

## Performance Improvements

1. **Parallel Execution**: Adapters run concurrently by default
2. **Selective Scanning**: Choose which adapters to run
3. **Built-in Caching**: Automatic price and position caching
4. **Timeout Handling**: Individual adapter timeouts prevent hanging
5. **Retry Logic**: Built into base adapter class

## Cleanup

After migration, you can remove these old files:

- `lib/services/portfolio/defi-balance-service.ts`
- `lib/services/comprehensive-position-checker.ts`
- `lib/services/thala-position-checker.ts` (if exists)
- `scripts/check-comprehensive-positions.ts`
- `scripts/check-thala-positions.ts`

Update the main test script:

- Modify `scripts/test-defi-positions.ts` to use the new provider
