# Fully Integrated DeFi Protocols

## Overview

The DeFi position scanner now supports comprehensive position tracking across multiple Aptos protocols using a modular adapter architecture.

## Fully Integrated Protocols

### 1. **Thala** (DEX & Farming)

- **Adapter**: `thala-adapter`
- **Features**:
  - ✅ Liquidity Pool positions (Stable & Weighted pools)
  - ✅ Farming positions (Thala Farm)
  - ✅ CDP positions (MOD stablecoin)
  - ❌ Liquid staking (thAPT) - Removed per request
- **Contract Addresses**: Multiple addresses for Infrastructure, Farm, and CDP modules

### 2. **LiquidSwap** (DEX)

- **Adapter**: `liquidswap-adapter`
- **Features**:
  - ✅ LP token positions (v0, v0.5, v1)
  - ✅ Staked/Farming positions
  - ✅ Support for stable, uncorrelated, and standard AMM pools
- **Contract Addresses**: Covers all LiquidSwap versions

### 3. **PancakeSwap** (DEX)

- **Adapter**: `pancakeswap-adapter`
- **Features**:
  - ✅ LP token positions
  - ✅ MasterChef farming positions
  - ✅ CAKE staking positions
- **Contract Addresses**: PancakeSwap v2 on Aptos

### 4. **Aries Markets** (Lending)

- **Adapter**: `aries-adapter`
- **Features**:
  - ✅ Supply positions
  - ✅ Borrow positions
  - ✅ Interest-bearing tokens (aTokens)
  - ✅ Health factor tracking
- **Contract Addresses**: Main Aries lending protocol

### 5. **Cellana Finance** (DEX)

- **Adapter**: `cellana-adapter`
- **Features**:
  - ✅ LP token positions
  - ✅ Farming/Staking positions
- **Contract Addresses**: Cellana DEX contracts

### 6. **SushiSwap** (DEX)

- **Adapter**: `sushiswap-adapter`
- **Features**:
  - ✅ LP token positions
  - ✅ MasterChef/MiniChef farming
  - ✅ SUSHI rewards tracking
- **Contract Addresses**: SushiSwap on Aptos

### 7. **Merkle Trade** (Derivatives)

- **Adapter**: `merkle-trade-adapter`
- **Features**:
  - ✅ MKLP liquidity provider tokens
  - ✅ Trading positions (longs/shorts)
  - ✅ Staked MKLP positions
  - ✅ Collateral tracking
- **Contract Addresses**: Merkle derivatives protocol

### 8. **Generic Token Adapter** (Fallback)

- **Adapter**: `generic-token-adapter`
- **Features**:
  - ✅ Any protocol tokens not covered by specific adapters
  - ✅ Automatic protocol identification using registry
  - ✅ Support for both FA and Coin standards
- **Purpose**: Catches any DeFi tokens that don't have dedicated adapters

## Architecture Benefits

1. **Modular Design**: Each protocol has its own adapter that can be independently maintained
2. **Extensibility**: New protocols can be added by creating new adapters
3. **Performance**: Parallel scanning of multiple protocols
4. **Type Safety**: Full TypeScript support with strict typing
5. **Error Resilience**: Failed adapters don't affect others
6. **Price Integration**: LP token price calculation service
7. **Resource Scanning**: Direct on-chain resource inspection for accurate position detection

## Usage

```typescript
import { createDeFiProvider } from '@/lib/services/defi/createDeFiProvider';

// Create provider with all adapters
const provider = await createDeFiProvider({
  apiKey: process.env.APTOS_BUILD_SECRET,
});

// Scan positions
const positions = await provider.scanPositions(walletAddress);
```

## Not Implemented (Per Request)

- ❌ Aave lending adapter
- ❌ TruFin liquid staking adapter
- ❌ Aptin Finance lending adapter
- ❌ Amnis liquid staking adapter (deleted)
- ❌ Thala liquid staking (thAPT)
