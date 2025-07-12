/**
 * Fallback data for critical endpoints when APIs are unavailable
 * This data should be manually updated periodically
 */

export const FALLBACK_DATA = {
  stablecoins: {
    supplies: [
      {
        symbol: 'USDt',
        supply: '1129955',
        supply_raw: '1129955433457121',
        percentage: 65.5,
        asset_type:
          '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
      },
      {
        symbol: 'USDC',
        supply: '278274',
        supply_raw: '278274454565133',
        percentage: 16.1,
        asset_type:
          '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
      },
      {
        symbol: 'sUSDe',
        supply: '42305',
        supply_raw: '42305114954831',
        percentage: 2.5,
        asset_type:
          '0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69',
      },
      {
        symbol: 'USDe',
        supply: '87',
        supply_raw: '87306710',
        percentage: 0.0,
        asset_type:
          '0xf37a8864fe737eb8ec2c2931047047cbaed1beed3fb0e5b7c5526dafd3b9c2e9',
      },
    ],
    total: '1450621',
    total_raw: '1450622309783795',
    timestamp: '2025-01-11T00:00:00Z',
  },
  bitcoin: {
    supplies: [
      {
        symbol: 'xBTC',
        supply: '100',
        supply_raw: '10000000000',
        percentage: 40.0,
      },
      {
        symbol: 'SBTC',
        supply: '100',
        supply_raw: '10000000000',
        percentage: 40.0,
      },
      {
        symbol: 'aBTC',
        supply: '50',
        supply_raw: '500000000000',
        percentage: 20.0,
      },
    ],
    total: '250',
    total_raw: '25000000000',
    timestamp: '2025-01-11T00:00:00Z',
  },
  lst: {
    supplies: [
      {
        symbol: 'thAPT',
        supply: '1000000',
        supply_raw: '100000000000000',
        percentage: 33.3,
      },
      {
        symbol: 'amAPT',
        supply: '1000000',
        supply_raw: '100000000000000',
        percentage: 33.3,
      },
      {
        symbol: 'stAPT',
        supply: '1000000',
        supply_raw: '100000000000000',
        percentage: 33.3,
      },
    ],
    total: '3000000',
    total_raw: '300000000000000',
    timestamp: '2025-01-11T00:00:00Z',
  },
  rwa: {
    protocols: [
      {
        name: 'Verified USD',
        supply: 500000000,
        tokenPrice: 1.0,
        chainTvl: 500000000,
      },
      {
        name: 'Real USD',
        supply: 100000000,
        tokenPrice: 1.0,
        chainTvl: 100000000,
      },
    ],
    total: 600000000,
    timestamp: '2025-01-11T00:00:00Z',
  },
};
