# Portfolio Timeframe Implementation

## Overview
This document outlines how different timeframes are implemented for the portfolio performance tracking.

## API Endpoints and Lookback Parameters

### 1. Store Balance History (`/historical_store_balances`)
- **Accepted lookback values**: `year`, `all`
- **Limitation**: Cannot get hourly data, only daily aggregates
- **Solution**: Always fetch with `year` lookback and filter client-side

### 2. Token Price History (`/token/historical_prices`)
- **Accepted lookback values**: `hour`, `day`, `week`, `month`
- **Mapping**:
  - 24h → `hour` (hourly data points)
  - 7d → `day` (daily data points)
  - 30d → `week` (weekly aggregates)
  - 90d, 1y → `month` (monthly aggregates)

### 3. Gas Usage (`/gas_usage`)
- **Bucket granularity options**: `1s`, `1m`, `5m`, `15m`, `1h`, `6h`, `1d`, `7d`
- **Mapping**:
  - 24h → `1h` (hourly buckets)
  - 7d, 30d → `1d` (daily buckets)
  - 90d, 1y → `7d` (weekly buckets)

## Implementation Details

### Portfolio History Route (`/api/portfolio/history/route.ts`)
- Uses `getStoreBalanceLookback()` for balance data (returns `year` or `all`)
- Uses `getTokenPriceLookback()` for price data (returns appropriate granularity)
- Combines and filters data based on requested timeframe

### Portfolio Performance Route (`/api/analytics/portfolio-performance/route.ts`)
- New endpoint specifically for timeframe-based performance
- Fetches appropriate granularity based on timeframe
- Interpolates hourly data for 24h view
- Provides consistent data structure across all timeframes

### Frontend Hooks

#### `usePortfolioHistory`
- Automatically uses performance endpoint for standard timeframes
- Falls back to history endpoint for custom day ranges
- Transforms data to consistent format

#### `useGasUsage`
- Accepts granularity parameter
- Passes appropriate bucket granularity to API

## Timeframe Support

| Timeframe | Balance Data | Price Data | Gas Granularity | Chart Points |
|-----------|--------------|------------|-----------------|--------------|
| 24h       | Daily (interpolated) | Hourly | 1h | ~24 points |
| 7d        | Daily | Daily | 1d | ~7 points |
| 30d       | Daily | Weekly | 1d | ~30 points |
| 90d       | Daily | Monthly | 7d | ~13 points |
| 1y        | Daily | Monthly | 7d | ~52 points |

## Performance Calculations

Each timeframe displays:
1. **Total Change**: End value - Start value
2. **Percentage Change**: ((End - Start) / Start) × 100
3. **High/Low**: Maximum and minimum values in period
4. **Volatility**: Standard deviation of daily returns
5. **Gas Usage**: Total gas spent in period

## Future Improvements

1. **Real-time updates**: WebSocket integration for live data
2. **More granular historical data**: Store balance API improvements
3. **Custom timeframe selection**: Date picker for arbitrary ranges
4. **Multi-asset tracking**: Include non-APT tokens in calculations