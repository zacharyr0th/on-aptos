import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssetService } from './asset-service'

// Mock fetch
global.fetch = vi.fn()

// Mock price aggregator
vi.mock('../utils/price-aggregator', () => ({
  PriceAggregator: {
    getPricesForAssets: vi.fn(),
  },
}))

import { PriceAggregator } from '../utils/price-aggregator'

describe('Asset Service', () => {
  const mockAddress = '0x' + '1'.repeat(64)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWalletAssets', () => {
    it('should fetch and merge fungible assets with token metadata', async () => {
      const mockGraphQLResponse = {
        data: {
          current_fungible_asset_balances: [
            {
              asset_type: '0x1::aptos_coin::AptosCoin',
              amount: '1000000000',
              metadata: {
                decimals: 8,
                name: 'Aptos',
                symbol: 'APT',
                token_standard: 'v1',
              },
            },
          ],
        },
      }

      const mockPrices = {
        '0x1::aptos_coin::AptosCoin': {
          assetType: '0x1::aptos_coin::AptosCoin',
          usdPrice: 5.53,
          confidence: 0.99,
          source: 'panora',
          timestamp: Date.now(),
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQLResponse,
      } as Response)

      vi.mocked(PriceAggregator.getPricesForAssets).mockResolvedValue(mockPrices)

      const result = await AssetService.getWalletAssets(mockAddress)

      expect(result).toHaveLength(1)
      expect(result[0].asset_type).toBe('0x1::aptos_coin::AptosCoin')
      expect(result[0].amount).toBe('1000000000')
    })

    it('should handle GraphQL errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const result = await AssetService.getWalletAssets(mockAddress)

      expect(result).toEqual([])
    })
  })
})