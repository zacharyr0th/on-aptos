import { NextRequest } from 'next/server'

import { apiLogger } from '@/lib/utils/logger'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/response-builder'

interface TokenMetadata {
  asset_type: string
  name: string
  symbol: string
  decimals: number
  creator_address: string
  token_standard: 'v1' | 'v2'
}

interface PanoraPrice {
  chainId: number
  tokenAddress: string | null
  faAddress: string | null
  symbol: string
  name: string
  decimals: number
  usdPrice: string
}

interface TokenMarketData {
  symbol: string
  name: string
  asset_type: string
  token_standard: 'v1' | 'v2'
  decimals: number
  usd_price: number
  market_cap_usd?: number
  circulating_supply?: number
}

const PANORA_API_KEY = process.env.PANORA_API_KEY!
const APTOS_GRAPHQL_URL = 'https://api.mainnet.aptoslabs.com/v1/graphql'

if (!process.env.PANORA_API_KEY) {
  throw new Error('PANORA_API_KEY environment variable is required')
}

async function fetchTokenMetadata(limit = 1000, offset = 0): Promise<TokenMetadata[]> {
  const query = `
    query GetTokenMetadata($limit: Int!, $offset: Int!) {
      fungible_asset_metadata(
        limit: $limit, 
        offset: $offset,
        order_by: {asset_type: asc}
      ) {
        asset_type
        name
        symbol
        decimals
        creator_address
        token_standard
      }
    }
  `

  const response = await fetch(APTOS_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.APTOS_BUILD_SECRET && {
        'Authorization': `Bearer ${process.env.APTOS_BUILD_SECRET}`
      })
    },
    body: JSON.stringify({
      query,
      variables: { limit, offset }
    })
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
  }

  return data.data.fungible_asset_metadata
}

async function fetchPanoraPrices(): Promise<PanoraPrice[]> {
  const response = await fetch('https://api.panora.exchange/prices', {
    headers: {
      'x-api-key': PANORA_API_KEY,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Panora API request failed: ${response.statusText}`)
  }

  return await response.json()
}

// Known token supplies - this could be moved to a database or external config
const KNOWN_SUPPLIES: Record<string, number> = {
  // APT has approximately 1.1 billion total supply
  '0x1::aptos_coin::AptosCoin': 1100000000,
  // Add other known supplies here as needed
}

async function getTokenSupply(assetType: string, _tokenStandard: 'v1' | 'v2'): Promise<number | null> {
  try {
    // Check if we have a known supply for this token
    if (KNOWN_SUPPLIES[assetType]) {
      return KNOWN_SUPPLIES[assetType]
    }

    // For other tokens, we'd need to implement supply calculation logic
    // This is complex because different token standards have different supply mechanics:
    // - Some FA tokens have max_supply in their metadata
    // - Others require summing all balances (expensive)
    // - Some are rebasing tokens where supply changes
    // - LP tokens have dynamic supply based on liquidity
    
    // For now, return null to indicate supply data is not available
    // In a production system, you'd implement per-token supply calculation
    return null
    
  } catch (error) {
    apiLogger.warn('Failed to get token supply', { assetType, error })
    return null
  }
}

export async function GET(_request: NextRequest) {
  const startTime = Date.now()
  
  try {
    apiLogger.info('Starting market cap calculation', {
      timestamp: new Date().toISOString()
    })

    // Fetch token metadata from Aptos
    const tokenMetadata = await fetchTokenMetadata(1000) // Get first 1000 tokens
    apiLogger.info(`Fetched ${tokenMetadata.length} tokens from Aptos GraphQL`)

    // Fetch prices from Panora
    const panoraPrices = await fetchPanoraPrices()
    apiLogger.info(`Fetched ${panoraPrices.length} prices from Panora`)

    // Create a mapping of asset types to prices
    const priceMap = new Map<string, PanoraPrice>()
    
    for (const price of panoraPrices) {
      // Map both FA addresses and token addresses
      if (price.faAddress) {
        priceMap.set(price.faAddress, price)
      }
      if (price.tokenAddress) {
        priceMap.set(price.tokenAddress, price)
      }
    }

    // Combine metadata with prices
    const tokenMarketData: TokenMarketData[] = []
    let totalMarketCapUsd = 0
    let tokensWithPrices = 0

    for (const token of tokenMetadata) {
      const priceData = priceMap.get(token.asset_type)
      
      if (priceData && priceData.usdPrice) {
        const usdPrice = parseFloat(priceData.usdPrice)
        
        // Get supply if available (placeholder for now)
        const supply = await getTokenSupply(token.asset_type, token.token_standard)
        
        let marketCap: number | undefined
        if (supply && supply > 0) {
          marketCap = (supply / Math.pow(10, token.decimals)) * usdPrice
          totalMarketCapUsd += marketCap
        }

        tokenMarketData.push({
          symbol: token.symbol,
          name: token.name,
          asset_type: token.asset_type,
          token_standard: token.token_standard,
          decimals: token.decimals,
          usd_price: usdPrice,
          market_cap_usd: marketCap,
          circulating_supply: supply ? supply / Math.pow(10, token.decimals) : undefined
        })

        tokensWithPrices++
      }
    }

    // Sort by market cap (descending), then by price
    tokenMarketData.sort((a, b) => {
      if (a.market_cap_usd && b.market_cap_usd) {
        return b.market_cap_usd - a.market_cap_usd
      }
      return b.usd_price - a.usd_price
    })

    const executionTime = Date.now() - startTime

    apiLogger.info('Market cap calculation completed', {
      totalTokens: tokenMetadata.length,
      tokensWithPrices,
      totalMarketCapUsd: totalMarketCapUsd > 0 ? totalMarketCapUsd : 'N/A (supply data needed)',
      executionTimeMs: executionTime
    })

    return createSuccessResponse({
      summary: {
        total_tokens_analyzed: tokenMetadata.length,
        tokens_with_prices: tokensWithPrices,
        total_market_cap_usd: totalMarketCapUsd > 0 ? totalMarketCapUsd : null,
        note: totalMarketCapUsd === 0 ? 'Market cap calculation requires token supply data' : undefined,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      },
      tokens: tokenMarketData.slice(0, 100), // Return top 100 for response size
      pagination: {
        showing: Math.min(100, tokenMarketData.length),
        total: tokenMarketData.length
      }
    }, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    
    apiLogger.error('Market cap calculation failed', {
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: executionTime
    })

    return createErrorResponse(
      'Failed to calculate market cap',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}