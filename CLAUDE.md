# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is a public good for the Aptos ecosystem. It has dashboards for stablecoins, bitcoin, RWAs, and DeFi as well as a portfolio tool to check out one's wallet.

Use https://aptos.dev/en/build/indexer/indexer-api/indexer-reference and make sure to NEVER USE DEPRECATED TABLES.
Use Panora Token list.

Only use the current_token_ownerships_v2 table.
NEVER the deprecated v1 table.
NEVER EVER USE MOCK DATA EVER.

## Panora Token List

The Panora Token List is a comprehensive, community-driven collection of tokens. It is designed to provide accurate information and eliminate confusion between similar-looking tokens, providing users with confidence and clarity while trading.

### Panora Tags

To enhance token classification and identification, we've introduced a field `panoraTags` in token list response. This field combines categories and labels into a single parameter, providing clearer insights and context about each token's status and characteristics. Here's what they represent:

#### Categories (Tokens are segregated on Panora UI based on their category):

- **Native**: Tokens that are native to the chain and issued directly on it (excludes meme)
- **Meme**: Tokens primarily driven by community hype, memes, or trends
- **Bridged**: Tokens that originate from another chain and are bridged for use

#### Labels:

**Verified**
Tokens with verified logo-to-address mapping to prevent confusion with similar tokens and meet nominal threshold metrics are eligible for Verified label. Verification focuses solely on ensuring accurate identification and does not imply endorsement, financial advice, or guarantee visibility on the Panora UI.

**Verification and Visibility:**
While we do not currently enforce strict verification metrics criteria, we monitor several key metrics to assess a token's label and/or its visibility on the Panora UI. These metrics are subject to changes and include, but are not limited to, liquidity, market cap, daily trading volume, total holder count, % of supply held by the top 10 holders, and stability of these metrics over a period of time.

**Verification Process:**
Projects can apply for the Verified label by submitting a Pull Request (PR) on the Panora Token List GitHub repo and posting an attestation tweet from their official X (Twitter) account. See the following page for a detailed step-by-step guide.

**Note:**
Not all projects may receive Verified status immediately and may remain as Recognized or Unverified after community review. Additionally, Verified label and/or default visibility of any token on Panora UI may be revoked due to factors such as updated verification criteria, community concerns or lack of transparency from the token project's development team, instability or significant drops in key metrics over a period of time. This is solely to protect the community and you are welcome to re-apply and re-tweet once your project gains more traction and community support. Projects within private Aptos Ecosystem Telegram groups or recognized by other Aptos Ecosystem projects and community members are prioritized for faster verification.

**Recognized**
Tokens that have logo-to-address mapping, but may not be tradable or recognized by the community yet, or have had their verified label revoked. Recognized tokens might also include niche or new tokens that are still in the early stages of establishing community support or demonstrating stability.

**Unverified**
Tokens that have not yet undergone the verification process but meet the minimum nominal liquidity requirements and have unique metadata. These tokens may or may not be recognized by the community and are hidden by default in the Panora UI. Unverified status is common for new or recently launched tokens and users can choose to trade these tokens at their own discretion.

**Banned**
Tokens that are restricted due to confirmed malicious behavior or security risks. It is recommended to avoid trading these assets.

**InternalFA**
Addresses created by certain DEX's before the pairing between Coin and Fungible Asset (FA) standard tokens were established. These may have unique behaviors or limitations.

**LP (Liquidity Pool)**
Tokens that represent liquidity pool shares after adding liquidity in trading pairs, indicating the proportion of assets held within a liquidity pool.

**Important Reminder:** Tokens don't need to have a Verified or Recognized label to be tradable. All tokens are automatically and instantly available for trading on Panora and all of its integrator partners and can be accessed by using the complete token address.

### Tokens Visible on Panora UI

By default, only tokens marked as panoraUI = true are displayed on the Panora UI, along with any other tokens held in the user's wallet, ensuring easy access to owned assets. However, all tokens available on-chain are searchable on Panora UI by name, symbol, emoji, or address.

### Accessing the Panora Token List

The Panora Token List can be accessed via the Token List GitHub Repository or through the public API endpoint.

**Public API Key:**

```
a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi
```

**Note:** This API key's limits should be sufficient for most use cases. For protocols in the Aptos ecosystem, please submit a ticket on Discord to get a dedicated API key.

**API Usage Example:**

GET https://api.panora.exchange/tokenlist

```javascript
const end_point = "https://api.panora.exchange/tokenlist";

const query = {
  isInPanoraTokenList: "true",
};

const headers = {
  "x-api-key":
    "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
};

const queryString = new URLSearchParams(query);
const url = `${end_point}?${queryString}`;

const response = await (
  await fetch(url, {
    method: "GET",
    headers: headers,
  })
).json();
```

#### Query Parameters

- **chainId** (string, optional): The chain ID associated with the token (Default: 1 for Aptos Mainnet).
- **tokenAddress** (string, optional): Comma-separated list of coin (legacy) and/or FA addresses. The API returns the details for the specified tokens. If not provided, the query will return details of all tokens marked as panoraUI = true.
- **panoraUI** (boolean, optional): If set to true, only tokens that are visible on the Panora UI are returned. Set as true, false to get all tokens in the list. Default is true.
- **panoraTags** (string, optional): Returns tokens based on their associated tags. All available tags are listed under the 'Panora Tags' section at the start of this page.

#### Aptos Token List Response

The response object contains the following fields:

- **chainId**: The chain ID associated with the token (Default: 1 for Aptos Mainnet)
- **panoraId**: A unique id given to all tokens by Panora
- **tokenAddress**: The complete address of the token as per the Aptos Coin Standard (Legacy)
- **faAddress**: The complete address of the token as per the Aptos Fungible Asset (FA) Standard
- **name**: The on-chain registered name of the token
- **symbol**: The on-chain registered symbol of the token
- **decimals**: The number of decimal places of the token
- **bridge**: The bridge associated with the token, if applicable (optional)
- **panoraSymbol**: Similar to symbol, but with prefixes based on the bridge: lz for LayerZero, wh for Wormhole, and ce for Celer
- **usdPrice**: The latest usd price of the token
- **logoUrl**: The URL for the token's logo (optional)
- **websiteUrl**: The official website URL of the token (optional)
- **panoraUI**: When set to true, displays the token name and logo on the Panora interface
- **panoraTags**: Lists the tags associated with the token
- **panoraIndex**: The default sorting order of tokens within the Panora UI
- **coinGeckoId**: The CoinGecko ID of the token (optional)
- **coinMarketCapId**: The CoinMarketCap ID of the token (optional)

**Example Response:**

```json
{
  "chainId": 1,
  "panoraId": "a1-vqom8-USDC",
  "tokenAddress": null,
  "faAddress": "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
  "name": "USDC",
  "symbol": "USDC",
  "decimals": 6,
  "bridge": null,
  "panoraSymbol": "USDC",
  "usdPrice": "0.99995004",
  "logoUrl": "https://assets.panora.exchange/tokens/aptos/USDC.svg",
  "websiteUrl": "https://circle.com/usdc",
  "panoraUI": true,
  "panoraTags": ["Native", "Verified"],
  "panoraIndex": 4,
  "coinGeckoId": "usd-coin",
  "coinMarketCapId": 3408,
  "isInPanoraTokenList": true, // Do not use. This field will get deprecated.
  "isBanned": false // Do not use. This field will get deprecated.
}
```

## Panora Prices API

### Token Prices

The Panora Price API provides real-time price data for tokens on the Aptos chain, making it easy for developers to integrate accurate pricing information into their dApps.

#### Key Features

- **Real-Time Price Feeds**: Get up-to-date token prices for accurate trading and analysis.
- **Wide Token Coverage**: Supports all tokens tradable on the Aptos mainnet network.

#### Accessing the Token Prices

The Token Prices can be accessed through the public API endpoint.

**Public API Key:**

```
a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi
```

**Note:** This API key's limits should be sufficient for most use cases. For protocols in the Aptos ecosystem, please submit a ticket on Discord to get a dedicated API key.

**API Usage Example:**

GET https://api.panora.exchange/prices

```javascript
const end_point = "https://api.panora.exchange/prices";

const query = {
  tokenAddress:
    "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
};

const headers = {
  "x-api-key":
    "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
};

const queryString = new URLSearchParams(query);
const url = `${end_point}?${queryString}`;

const response = await (
  await fetch(url, {
    method: "GET",
    headers: headers,
  })
).json();
```

#### Query Parameters

- **chainId** (string, optional): The chain ID associated with the token (Default: 1 for Aptos Mainnet).
- **tokenAddress** (string, optional): Comma-separated list of coin (legacy) and/or FA addresses. The API returns the price information for the specified tokens. If not provided, the query will return prices of all tokens having liquidity above a nominal threshold.

#### Token Price Response

The response object contains the following fields:

- **chainId**: The chain ID associated with the token (Default: 1 for Aptos Mainnet)
- **tokenAddress**: The complete address of the token as per the Aptos Coin Standard (Legacy)
- **faAddress**: The complete address of the token as per the Aptos Fungible Asset (FA) Standard
- **name**: The on-chain registered name of the token
- **symbol**: The on-chain registered symbol of the token
- **decimals**: The number of decimal places of the token
- **usdPrice**: The latest usd price of the token
- **nativePrice**: The latest price of the token relative to the native token

**Example Response:**

```json
[
  {
    "chainId": 1,
    "tokenAddress": null,
    "faAddress": "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
    "name": "USDC",
    "symbol": "USDC",
    "decimals": 6,
    "usdPrice": "0.99995",
    "nativePrice": "0.18077031"
  }
]
```

## Logging Requirements

- ALWAYS use the pino logger from lib/utils/core/logger.ts instead of console.log, console.warn, or console.error
- Import the logger like: `import { logger, apiLogger, serviceLogger } from '@/lib/utils/core/logger'`
- Use appropriate log levels: logger.debug(), logger.info(), logger.warn(), logger.error()
- Use specialized loggers for different modules: apiLogger for API routes, serviceLogger for business logic, etc.
- The CI pipeline will fail if console.\* methods are used in source code (excluding tests and scripts)
- For API routes, always use apiLogger to track requests and responses
- For errors, use logger.error() or errorLogger.error() with proper context
- Log levels are automatically configured based on NODE_ENV (debug in development, info in production)

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User

## Portfolio-Specific Guidelines

When working with the portfolio feature:

- NFT metrics (total count, collections, etc.) should be based on ALL NFTs owned by the wallet, not just the loaded subset
- Use the batch API endpoint (/api/portfolio/batch) for fetching portfolio data to reduce API calls
- The NFTService.getTotalNFTCount() returns the full count of NFTs, while getWalletNFTs() returns paginated results
- Collection statistics should reflect the wallet's ownership distribution across all collections, not just loaded NFTs
- When displaying NFT counts in the UI, use totalNFTCount for accurate metrics, not nfts.length

## API Authentication

- Always include APTOS_BUILD_SECRET as Bearer token in GraphQL requests to avoid rate limiting
- The Aptos Indexer API requires authentication for better rate limits
- When using direct fetch to Aptos GraphQL endpoint, include Authorization header with process.env.APTOS_BUILD_SECRET

## GraphQL Queries

- Only use current_token_ownerships_v2 table for NFTs, NEVER the deprecated v1 table
- When counting NFTs, always filter by amount > 0 to exclude burned/transferred NFTs
- Use current_fungible_asset_balances for token balances, not the deprecated coin_balances
- The current_token_ownerships_v2_aggregate table is used for counting NFTs efficiently

## Caching Strategy

- Panora token prices are cached for 5 minutes using SimpleCache
- API routes should include cache headers: Cache-Control: public, s-maxage=300, stale-while-revalidate=600
- Portfolio data uses a batch API to reduce the number of requests from 3+ to 1

## Error Handling

- Use exponential backoff for rate-limited requests (429 status)
- NFT service includes retry logic with delays: 1s, 2s, 4s, 8s, 16s, 32s
- Always handle Promise.allSettled results individually to prevent one failure from breaking everything
- Return default/empty values on error to keep the UI functional
