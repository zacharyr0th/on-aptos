# Portfolio Performance Chart

## Overview

The portfolio performance chart displays your APT holdings value over the last 7 days with real-time data from blockchain and price APIs.

## Data Sources

### 1. Balance History API (`/api/portfolio/balance-history`)

- **Source**: Aptos blockchain indexer
- **Data**:
  - Current APT balance from `current_fungible_asset_balances` table
  - Historical transactions from `fungible_asset_activities` table
  - Reconstructs daily balances by working backwards from current balance
- **Features**:
  - 3 retry attempts with backoff (1s, 2s, 3s)
  - 2-minute cache for successful responses
  - Returns actual blockchain data only

### 2. APT Price History API (`/api/portfolio/apt-price-history`)

- **Sources**:
  - Today's price: Panora Exchange API
  - Historical prices (6 days): CoinGecko market_chart API (single request)
- **Features**:
  - 3 retry attempts with exponential backoff (2s, 4s, 8s)
  - 5-minute cache for successful responses
  - 10-second timeout on requests
  - No fallback data - returns error if APIs fail

## How It Works

1. **Frontend Hook** (`usePortfolioHistoryV2`):
   - Fetches both APIs in parallel
   - Combines balance and price data for each day
   - Calculates portfolio value: `balance × price`

2. **Chart Display**:
   - Shows 7-day line chart with daily values at noon UTC
   - Orange dots indicate days where price data was rate-limited
   - Displays total change and percentage change

3. **Reliability Features**:
   - Automatic retries on API failures
   - Response caching to reduce API calls
   - Partial data handling (shows available data if one API fails)
   - Error boundaries for graceful failure

## No Mock Data Policy

- **Zero hardcoded values**
- **Zero fallback prices**
- **Zero estimated data**
- All data comes from real APIs or returns an error

## API Response Format

### Balance History

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-07-02",
      "timestamp": "2025-07-02T12:00:00.000Z",
      "balances": {
        "0x1::aptos_coin::AptosCoin": 4.43705603
      }
    }
  ],
  "meta": {
    "walletAddress": "0x...",
    "currentBalance": 4.43705603,
    "transactionsProcessed": 12
  }
}
```

### Price History

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-07-02",
      "timestamp": "2025-07-02T12:00:00.000Z",
      "price": 4.495,
      "dataSource": "coingecko",
      "hasData": true
    }
  ],
  "meta": {
    "days": 7,
    "successfulPrices": 7,
    "missingDays": 0
  }
}
```
