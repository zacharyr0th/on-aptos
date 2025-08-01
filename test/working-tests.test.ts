import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock all dependencies upfront
vi.mock('@/lib/services/portfolio/services/asset-service', () => ({
  AssetService: {
    getWalletAssets: vi.fn().mockResolvedValue([
      {
        asset_type: '0x1::aptos_coin::AptosCoin',
        amount: '1000000000',
        metadata: { symbol: 'APT', decimals: 8 },
      },
    ]),
  },
}))

vi.mock('@/lib/services/portfolio/services/nft-service', () => ({
  NFTService: {
    getWalletNFTs: vi.fn().mockResolvedValue({ data: [], hasMore: false, count: 0 }),
    getTotalNFTCount: vi.fn().mockResolvedValue(0),
    getNFTCollectionStats: vi.fn().mockResolvedValue({ collections: [], totalCollections: 0 }),
  },
}))

vi.mock('@/lib/services/assets/services/bitcoin-service', () => ({
  BitcoinService: {
    getBitcoinOnAptos: vi.fn().mockResolvedValue({
      totalSupply: '100',
      totalSupplyUSD: '4500000',
      protocols: [],
    }),
  },
}))

vi.mock('@/lib/services/assets/services/stablecoin-service', () => ({
  StablecoinService: {
    getStablecoinsOnAptos: vi.fn().mockResolvedValue({
      totalSupply: '1000000',
      totalSupplyUSD: '1000000',
      stablecoins: [],
    }),
  },
}))

describe('Working API Tests', () => {
  describe('Portfolio Assets', () => {
    it('should fetch wallet assets successfully', async () => {
      const { GET } = await import('@/app/api/portfolio/assets/route')
      const validAddress = '0x' + '1'.repeat(64)
      const request = new NextRequest(`http://localhost:3000/api/portfolio/assets?walletAddress=${validAddress}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.assets).toHaveLength(1)
    })
  })

  describe('Portfolio NFTs', () => {
    it('should fetch wallet NFTs successfully', async () => {
      const { GET } = await import('@/app/api/portfolio/nfts/route')
      const validAddress = '0x' + '1'.repeat(64)
      const request = new NextRequest(`http://localhost:3000/api/portfolio/nfts?walletAddress=${validAddress}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.nfts).toBeDefined()
    })
  })

  describe('Aptos BTC', () => {
    it('should fetch Bitcoin data on Aptos', async () => {
      const { GET } = await import('@/app/api/aptos/btc/route')
      const request = new NextRequest('http://localhost:3000/api/aptos/btc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.data.total).toBeDefined()
    })
  })

  describe('Aptos Stables', () => {
    it('should fetch stablecoin data on Aptos', async () => {
      // Mock fetch for the stables route
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            fungible_asset_metadata: [],
            current_fungible_asset_balances: [],
          },
        }),
      } as Response)

      const { GET } = await import('@/app/api/aptos/stables/route')
      const request = new NextRequest('http://localhost:3000/api/aptos/stables')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.data.supplies).toBeDefined()
      expect(data.data.total).toBeDefined()
    })
  })

  describe('Utility Functions', () => {
    it('should format numbers correctly', async () => {
      const { formatNumber, formatCurrency, formatLargeNumber } = await import('@/lib/utils/format')
      
      // Basic number formatting
      expect(formatNumber(1234.56)).toBe('1,234.56')
      expect(formatNumber(0)).toBe('0')
      
      // Currency formatting
      expect(formatCurrency(100)).toBe('$100')
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      
      // Large number formatting
      expect(formatLargeNumber(1000)).toBe('1k')
      expect(formatLargeNumber(1000000)).toBe('1m')
    })

    it('should handle cache operations', async () => {
      const { SimpleCache } = await import('@/lib/utils/simple-cache')
      const cache = new SimpleCache<string>(100)
      
      cache.set('key', 'value')
      expect(cache.get('key')).toBe('value')
      
      cache.clear()
      expect(cache.get('key')).toBeNull()
    })
  })
})