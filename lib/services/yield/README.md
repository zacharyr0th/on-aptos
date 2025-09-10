# Yield Services

A comprehensive suite of services for discovering, managing, and optimizing yield farming opportunities across various DeFi protocols on the Aptos blockchain.

## Overview

The yield services provide functionality for:

- **Yield Discovery**: Finding yield opportunities across lending, liquidity provision, staking, and farming
- **Strategy Generation**: Creating optimal yield farming strategies based on user preferences
- **Auto-compounding**: Managing automatic reward compounding for existing positions
- **Cross-protocol Integration**: Unified interface for multiple DeFi protocols

## Architecture

```
lib/services/yield/
├── types.ts                    # Centralized type definitions
├── AptosResourceFetcher.ts     # On-chain data fetching utilities
├── DefiLlamaIntegration.ts     # External yield data integration
├── YieldAggregatorService.ts   # Main yield discovery and strategy service
├── AutoCompoundService.ts      # Auto-compound and harvest management
├── index.ts                    # Public API exports
└── __tests__/                  # Unit tests
```

## Services

### YieldAggregatorService

The main service for discovering yield opportunities and generating optimal strategies.

```typescript
import { YieldAggregatorService } from "@/lib/services/yield";

const yieldService = YieldAggregatorService.getInstance();

// Discover all available opportunities
const opportunities = await yieldService.discoverOpportunities();

// Filter opportunities
const filteredOpportunities = await yieldService.discoverOpportunities(
  undefined,
  {
    minAPY: 10,
    maxRisk: "medium",
    protocols: ["Thala", "Aries"],
    assets: ["0x1::aptos_coin::AptosCoin"],
  },
);

// Generate optimal strategies
const strategies = await yieldService.generateStrategies("0xwallet_address", {
  riskTolerance: "moderate",
  availableCapital: 10000,
  targetAPY: 15,
});
```

**Key Features:**

- Multi-protocol opportunity discovery
- Risk-based filtering and strategy generation
- Weighted APY calculations for optimal allocation
- Error-resilient data fetching with Promise.allSettled

### AptosResourceFetcher

Utility service for fetching on-chain data from Aptos protocols.

```typescript
import { AptosResourceFetcher } from "@/lib/services/yield";

const fetcher = AptosResourceFetcher.getInstance();

// Get all resources for an account
const resources = await fetcher.getResources("0xprotocol_address");

// Get specific resource
const resource = await fetcher.getResource("0xaccount", "ResourceType");

// Fetch protocol opportunities
const opportunities = await fetcher.fetchProtocolOpportunities(
  "ProtocolName",
  "0xprotocol_address",
  {
    resourceFilters: ["ResourceTypeFilter"],
    opportunityType: "lending",
    protocolType: "lending",
    risk: "low",
    features: ["Auto-compound"],
  },
);
```

**Key Features:**

- Cached resource fetching (5-minute TTL)
- Generic protocol opportunity extraction
- Built-in APY and TVL calculation methods
- Address extraction utilities for coin types

### DefiLlamaIntegration

Integration with DefiLlama's yield API for external yield data.

```typescript
import { DefiLlamaIntegration } from "@/lib/services/yield";

const defiLlama = DefiLlamaIntegration.getInstance();

// Get all Aptos pools
const aptosPools = await defiLlama.getAptosPools();

// Transform to standardized format
const opportunities = aptosPools.map((pool) => defiLlama.transformPool(pool));

// Get protocol statistics
const stats = await defiLlama.getProtocolStats("thala");

// Get historical data
const history = await defiLlama.getPoolHistory("pool_id");
```

**Key Features:**

- Real-time yield data from DefiLlama
- Standardized opportunity format transformation
- Historical APY data access
- Protocol statistics and metrics

### AutoCompoundService

Service for managing auto-compound and reward harvesting operations.

```typescript
import { AutoCompoundService } from '@/lib/services/yield';

const compoundService = AutoCompoundService.getInstance();

// Scan for compoundable positions
const compoundable = await compoundService.scanCompoundablePositions('0xwallet');

// Execute auto-compound
const result = await compoundService.executeCompound(position, '0xwallet');

// Batch harvest rewards
const harvestable = await compoundService.scanHarvestableRewards('0xwallet');
const harvestResult = await compoundService.executeBatchHarvest(harvestable, '0xwallet');

// Calculate optimal compound frequency
const frequency = compoundService.calculateOptimalCompoundFrequency(
  positionValue: 10000,
  apy: 15,
  gasEstimate: 100
);
```

**Key Features:**

- Profitability-based compound execution
- Gas cost optimization
- Batch reward harvesting
- Frequency optimization calculations

## Types

All types are centralized in `types.ts` to ensure consistency and reduce duplication:

### YieldOpportunity

Comprehensive yield opportunity with all metadata including fees, lock periods, and user deposits.

### ProtocolOpportunity

Protocol-specific opportunity data from on-chain resources.

### YieldStrategy

Multi-step yield farming strategy with allocation and risk parameters.

### CompoundablePosition

Position eligible for auto-compounding with profitability metrics.

### HarvestablePosition

Position with claimable rewards and gas cost estimates.

## Usage Examples

### Basic Yield Discovery

```typescript
import { YieldAggregatorService } from "@/lib/services/yield";

async function findBestYields() {
  const service = YieldAggregatorService.getInstance();

  const opportunities = await service.discoverOpportunities(undefined, {
    minAPY: 5,
    maxRisk: "medium",
    includeInactive: false,
  });

  // Get top 5 opportunities
  return opportunities.slice(0, 5);
}
```

### Strategy Generation

```typescript
import { YieldAggregatorService } from "@/lib/services/yield";

async function generateYieldStrategy(walletAddress: string, capital: number) {
  const service = YieldAggregatorService.getInstance();

  const strategies = await service.generateStrategies(walletAddress, {
    riskTolerance: "moderate",
    availableCapital: capital,
    targetAPY: 12,
  });

  return strategies[0]; // Return best strategy
}
```

### Auto-compound Management

```typescript
import { AutoCompoundService } from "@/lib/services/yield";

async function manageAutoCompound(walletAddress: string) {
  const service = AutoCompoundService.getInstance();

  // Find profitable positions to compound
  const positions = await service.scanCompoundablePositions(walletAddress);

  // Execute compounds for profitable positions
  const results = await Promise.all(
    positions.map((pos) => service.executeCompound(pos, walletAddress)),
  );

  return results.filter((r) => r.success);
}
```

## Error Handling

All services implement comprehensive error handling:

- **Network failures**: Graceful fallbacks and retries
- **Invalid data**: Type validation and sanitization
- **Rate limiting**: Exponential backoff strategies
- **Protocol errors**: Individual protocol failure isolation

```typescript
// Services return empty arrays on error rather than throwing
const opportunities = await yieldService.discoverOpportunities();
// Will return [] if any errors occur, never throws
```

## Caching

- **AptosResourceFetcher**: 5-minute TTL for resource data
- **DefiLlamaIntegration**: 5-minute TTL for pool data
- All caches use in-memory Map with timestamp validation

## Testing

Unit tests are provided for critical business logic:

```bash
# Run yield service tests
npm test -- lib/services/yield

# Run specific test file
npm test -- YieldAggregatorService.test.ts
```

Tests cover:

- Opportunity filtering and sorting logic
- Strategy generation algorithms
- APY calculation methods
- Error handling scenarios

## Protocol Support

### Currently Supported

- **Aries Markets**: Lending protocol integration
- **Echelon**: Multi-asset lending platform
- **Echo**: Bitcoin lending protocol
- **Meso Finance**: Cross-chain lending
- **Thala**: DEX and stable pools
- **LiquidSwap**: Low-fee DEX pools
- **Amnis Finance**: Liquid staking (stAPT)
- **PancakeSwap**: Farming opportunities

### Adding New Protocols

1. Add protocol configuration to `PROTOCOLS` constant
2. Create resource filters for the protocol's data structures
3. Add protocol-specific APY/TVL calculation logic
4. Update opportunity fetcher methods

```typescript
// Example: Adding new protocol
const opportunities = await this.fetchProtocolOpportunities(
  "NewProtocol",
  PROTOCOLS.NEW_PROTOCOL.addresses[0],
  {
    resourceFilters: ["NewProtocol::pool::PoolResource"],
    opportunityType: "farming",
    protocolType: "farming",
    risk: "medium",
    features: ["Multi-token rewards"],
  },
);
```

## Configuration

Key configuration points:

- **Cache timeouts**: Adjust `cacheTimeout` in individual services
- **Risk thresholds**: Modify risk calculation logic in opportunity transformers
- **Gas estimates**: Update gas cost calculations for profitability checks
- **Protocol addresses**: Maintain in centralized protocol registry

## Performance

- **Parallel fetching**: All opportunity sources fetched concurrently
- **Error isolation**: Promise.allSettled prevents cascading failures
- **Caching**: Reduces redundant API calls
- **Lazy loading**: Services instantiated on-demand with singleton pattern

## Security

- **No credential storage**: All services are read-only data fetchers
- **Input validation**: All user inputs validated and sanitized
- **Rate limiting**: Built-in protections against API abuse
- **Error disclosure**: Minimal error information exposed to prevent information leakage
