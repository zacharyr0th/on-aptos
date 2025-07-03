# On Aptos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive API service and frontend that provides real-time information about token supplies, prices, and analytics on the Aptos blockchain.

## Overview

On Aptos fetches current circulating supply and pricing data for stablecoins, Bitcoin-wrapped tokens, and Liquid Staking Tokens (LSTs) on Aptos using the Aptos Indexer GraphQL API and multiple price feeds. It handles both token standards (legacy coin standard and newer Fungible-Asset standard).

**Architecture**: The frontend uses **tRPC** for type-safe, end-to-end data fetching, while REST API endpoints remain available for external integrations.

![On Aptos Dashboard](/public/page.png)

You can view detailed information about each token by clicking on its card:

![Detailed token information dialog](/public/dialog.png)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- API keys for:
  - [CoinMarketCap](https://coinmarketcap.com/api/)
  - [RWA.xyz](https://rwa.xyz) (for RWA data)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/zacharyr0th/on-aptos.git
cd on-aptos
```

2. Install dependencies:

```bash
pnpm install
# or
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file with your API keys and settings:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Your App Name

# API Keys (required)
CMC_API_KEY=your_coinmarketcap_api_key_here
RWA_API_KEY=your_rwa_api_key_here

# Developer Information (optional)
DEVELOPER_NAME=Your Name
DEVELOPER_EMAIL=your-email@example.com
```

5. Run the development server:

```bash
pnpm dev
# or
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
pnpm build
pnpm start
```

## Supported Assets

### Stablecoins

- **USDt**: Tether USD (USDT)
- **USDC**: Circle USD Coin (USDC)
- **USDe**: Ethena's USDe
- **sUSDe**: Staked USDe

### Bitcoin-wrapped Tokens

- **xBTC**: OKX wBTC
- **SBTC**: StakeStone Bitcoin (formerly lzSBTC)
- **aBTC**: aBTC

### Liquid Staking Tokens (LSTs)

- **amAPT**: Amnis APT
- **stAPT**: Staked APT (amAPT)
- **thAPT**: Thala APT
- **sthAPT**: Staked Thala APT
- **kAPT**: Kofi APT
- **stkAPT**: Staked Kofi APT

## API Endpoints

### Aptos Asset Supply APIs

#### GET `/api/aptos/stables`

Returns current supply data for all supported stablecoins.

**Example Response:**

```json
{
  "supplies": [
    {
      "symbol": "USDt",
      "supply": "1130000000600000"
    },
    {
      "symbol": "USDC",
      "supply": "284452249983816"
    },
    {
      "symbol": "USDe",
      "supply": "183411687"
    },
    {
      "symbol": "sUSDe",
      "supply": "65235918477665"
    }
  ],
  "total": "1479688352473168"
}
```

#### GET `/api/aptos/btc`

Returns current supply data for Bitcoin-wrapped tokens on Aptos.

**Example Response:**

```json
{
  "supplies": [
    {
      "symbol": "xBTC",
      "name": "OKX wBTC",
      "supply": "12345678900000",
      "formatted_supply": "1,234.567890",
      "decimals": 8,
      "asset_type": "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387"
    }
  ],
  "total": "12345678900000",
  "total_formatted": "1,234.567890"
}
```

#### GET `/api/aptos/btc/echelon`

Returns Bitcoin supply data specifically formatted for Echelon integration.

#### GET `/api/aptos/lst`

Returns current supply data for Liquid Staking Tokens (LSTs).

**Query Parameters:**

- `refresh=true` - Force refresh cache and fetch latest data

**Example Response:**

```json
{
  "supplies": [
    {
      "symbol": "amAPT",
      "name": "Amnis APT",
      "supply": "98765432100000",
      "formatted_supply": "987,654.321000",
      "decimals": 8,
      "asset_type": "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt"
    }
  ],
  "total": "98765432100000",
  "total_formatted": "987,654.321000"
}
```

### Price Data APIs

#### GET `/api/prices/panora`

Returns current USD prices for LST tokens from Panora Exchange.

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "amAPT",
      "name": "Amnis APT",
      "asset_type": "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
      "price": "12.345678",
      "decimals": 8
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "attribution": "Powered by Panora"
}
```

#### GET `/api/prices/cmc/btc`

Returns Bitcoin price data from CoinMarketCap.

#### GET `/api/prices/cmc/susde`

Returns sUSDe price data from CoinMarketCap.

## Dashboard Pages

### Home Page (`/`)

**Features:**

- Landing page with overview of API capabilities
- Navigation to specialized dashboards
- Feature highlights for market share, price stability, and supply metrics

### Stablecoins Dashboard (`/stables`)

**Features:**

- Real-time stablecoin supply tracking
- Market share visualization
- Peg deviation analysis
- Interactive charts and detailed token information

### Bitcoin Dashboard (`/btc`)

**Features:**

- Bitcoin-wrapped token supply monitoring
- Cross-bridge analytics
- Price tracking and comparisons
- Supply distribution charts

### LST Dashboard (`/lst`)

**Features:**

- Liquid Staking Token analytics
- Staking rewards and APY tracking
- Supply growth metrics
- Price performance analysis

## Money Markets & DeFi Integration

**🚧 Ongoing Development**

On Aptos now includes a **Money Markets** monitoring functionality, starting with real time data pulled from protocols about Bitcoin on Aptos.

### Current Features (Bitcoin Markets)

- **Multi-Protocol Support**: Integration with Echelon Markets and Echo Protocol
- **Yield Analytics**: Real-time supply APY, borrow APY, and incentivized rewards tracking
- **Market Depth**: Total supply, borrowing volume, and TVL (Total Value Locked) metrics
- **Interactive Details**: Click any market for detailed yield breakdowns and protocol information
- **Cross-Protocol Comparison**: Side-by-side analysis of lending rates across platforms

### Technical Implementation

- **Real-time Data**: Live integration with protocol APIs and on-chain data
- **Smart Caching**: Efficient data fetching with fallback mechanisms
- **Responsive Design**: Mobile-optimized tables and dialogs
- **Error Handling**: Graceful degradation when protocol data is unavailable

## Technical Details

### Frontend (tRPC Implementation)

- **Type Safety**: End-to-end TypeScript types shared between client and server
- **Automatic Code Generation**: tRPC generates client code automatically from server procedures
- **React Query Integration**: Built-in caching, background updates, and synchronization
- **Error Handling**: Standardized error types with automatic retry logic
- **Optimistic Updates**: Instant UI feedback with automatic rollback on errors

### Backend & API Layer

- **Caching**: Intelligent LRU caching with configurable TTL (1-4 hours depending on endpoint)
- **Rate Limiting**: Built-in rate limiting to prevent API abuse
- **Retry Logic**: Automatic retries with exponential backoff for failed requests
- **Error Handling**: Graceful degradation with fallback to cached data
- **Data Precision**: All supplies returned as strings to preserve precision with large numbers
- **Real-time Updates**: Automatic cache refresh when data approaches expiration

## Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
# Copy the example below to create your .env.local file
# Add your actual API keys (see Environment Variables section below)

# Start the development server
pnpm dev

# Build for production
pnpm build

# Start the production server
pnpm start

# Format code
pnpm format

# Clean everything and reinstall
pnpm clean
```

### tRPC Development

The application uses tRPC for type-safe API development. Key files:

- **tRPC Router Configuration**: `lib/trpc/routers/` - Define API procedures
- **Client Setup**: `lib/trpc/client.ts` - tRPC client configuration
- **Server Setup**: `app/api/trpc/[trpc]/route.ts` - tRPC server endpoint

When developing with tRPC:

1. **Add New Procedures**: Define new API endpoints in the appropriate router file
2. **Type Safety**: TypeScript will automatically infer types for client usage
3. **No Manual API Client Code**: tRPC generates the client automatically
4. **Hot Reload**: Changes to tRPC procedures update the frontend immediately

## Environment Variables

**Required API Keys:**

- `CMC_API_KEY` (Required): A CoinMarketCap API key for accessing Bitcoin and other token price data. You must obtain a key from [CoinMarketCap's API Portal](https://coinmarketcap.com/api/).
- `PANORA_API_KEY` (Required): A Panora Exchange API key for accessing LST token price data. Use their public key or contact Panora Exchange for API access.

**Optional API Keys:**

- `APTOS_BUILD_KEY` (Optional): Aptos Indexer API key for enhanced rate limits. Get from [Aptos Developer Portal](https://aptos.dev/indexer/).
- `APTOS_BUILD_SECRET` (Optional): Aptos Indexer API secret. Works with the above key.

**Important:** Create a `.env.local` file in the project root with your actual API keys before running the application.

### Sample .env.local Configuration

```bash
# CoinMarketCap API Key (Required)
CMC_API_KEY=your_coinmarketcap_api_key_here

# Panora Exchange API Key (Required)
PANORA_API_KEY=your_panora_api_key_here

# Aptos Indexer API Credentials (Optional)
APTOS_BUILD_KEY=your_aptos_build_key_here
APTOS_BUILD_SECRET=your_aptos_build_secret_here
```

## Testing

To test the APIs, start the server and run:

```bash
# Test stablecoin supplies
curl http://localhost:3001/api/aptos/stables | jq

# Test Bitcoin token supplies
curl http://localhost:3001/api/aptos/btc | jq

# Test LST supplies
curl http://localhost:3001/api/aptos/lst | jq

# Test LST prices
curl http://localhost:3001/api/prices/panora | jq

# Test Bitcoin prices
curl http://localhost:3001/api/prices/cmc/btc | jq
```

**Legacy Endpoint:**
The original `/api/supply` endpoint is still available and redirects to `/api/aptos/stables` for backward compatibility.

## Contributing

Contributions are welcome- please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Adding Support for New Assets

To add support for new tokens:

1. **For Stablecoins**: Add the token information to the `TOKENS` object in `app/api/aptos/stables/route.ts`
2. **For Bitcoin tokens**: Add to the `TOKENS` object in `app/api/aptos/btc/route.ts`
3. **For LSTs**: Add to the `TOKENS` array in `app/api/aptos/lst/route.ts`
4. Add metadata for the UI in the respective page components in `components/pages/`
5. Add an icon in the `public/icons` directory

### Adding New Price Sources

To integrate additional price feeds:

1. Create a new route in `app/api/prices/[provider]/route.ts`

## Frontend Architecture (tRPC)

The frontend application uses **tRPC** for type-safe data fetching and state management. This provides:

- **End-to-end Type Safety**: Shared types between client and server
- **Automatic Code Generation**: No manual API client code needed
- **Built-in Error Handling**: Standardized error types and handling
- **Optimistic Updates**: Instant UI feedback with automatic revalidation
- **React Query Integration**: Powerful caching, background updates, and synchronization

### tRPC Routers

The application includes the following tRPC routers:

#### Stables Router (`lib/trpc/routers/stables.ts`)

- `getStablesData` - Fetch all stablecoin supply and price data
- `getStableDetails` - Get detailed information for a specific stablecoin

#### Bitcoin Router (`lib/trpc/routers/btc.ts`)

- `getBitcoinData` - Fetch all Bitcoin-wrapped token data
- `getBitcoinDetails` - Get detailed information for a specific Bitcoin token
- `getEchelonData` - Fetch Bitcoin lending market data from Echelon

#### LST Router (`lib/trpc/routers/lst.ts`)

- `getLSTData` - Fetch all Liquid Staking Token data
- `getLSTDetails` - Get detailed information for a specific LST
- `refreshLSTData` - Force refresh cached LST data

#### Prices Router (`lib/trpc/routers/prices.ts`)

- `getPanoraData` - Fetch price data from Panora Exchange
- `getBitcoinPrice` - Get Bitcoin price from CoinMarketCap
- `getSUSDePrice` - Get sUSDe price from CoinMarketCap

### Usage Example

```typescript
import { api } from '@/lib/trpc/client';

// In a React component
function StablecoinsDashboard() {
  const { data, isLoading, error } = api.stables.getStablesData.useQuery();

  const refreshMutation = api.stables.getStablesData.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.stables.getStablesData.invalidate();
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return <StablecoinsTable data={data} />;
}
```
