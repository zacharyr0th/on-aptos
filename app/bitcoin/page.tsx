import BitcoinPage from '@/components/pages/btc/Page';

// Revalidate daily for Bitcoin supply data (maximum cost savings)
export const revalidate = 86400;

// BTC token configurations - simplified
const BTC_TOKENS = {
  xBTC: {
    asset_type:
      '0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387',
    decimals: 8,
  },
  SBTC: {
    asset_type:
      '0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin',
    decimals: 8,
  },
  WBTC: {
    asset_type:
      '0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d',
    decimals: 8,
  },
  aBTC: {
    asset_type:
      '0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC',
    decimals: 10,
  },
} as const;

async function fetchBitcoinPrice() {
  try {
    // Use xBTC price as proxy for Bitcoin price
    const xBTCAddress = BTC_TOKENS.xBTC.asset_type;
    // In server components, we need to use absolute URLs
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(
      `${baseUrl}/api/analytics/token-latest-price?address=${xBTCAddress}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].price_usd;
      }
    }
  } catch (error) {
    console.error('Failed to fetch Bitcoin price from token API:', error);
  }
  return null;
}

async function fetchBTCData() {
  console.log('[BTC Page] Starting data fetch...');
  console.log(
    '[BTC Page] APTOS_BUILD_SECRET available:',
    !!process.env.APTOS_BUILD_SECRET
  );

  const query = `
    query GetBTCSupplies {
      xBTC: current_fungible_asset_balances_aggregate(
        where: {
          asset_type: {_eq: "${BTC_TOKENS.xBTC.asset_type}"},
          amount: {_gt: "0"}
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      SBTC: current_fungible_asset_balances_aggregate(
        where: {
          asset_type: {_eq: "${BTC_TOKENS.SBTC.asset_type}"},
          amount: {_gt: "0"}
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      WBTC: current_fungible_asset_balances_aggregate(
        where: {
          asset_type: {_eq: "${BTC_TOKENS.WBTC.asset_type}"},
          amount: {_gt: "0"}
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      aBTC: current_fungible_asset_balances_aggregate(
        where: {
          asset_type: {_eq: "${BTC_TOKENS.aBTC.asset_type}"},
          amount: {_gt: "0"}
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  `;

  console.log('[BTC Page] Making GraphQL request...');
  const response = await fetch('https://api.mainnet.aptoslabs.com/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}`,
    },
    body: JSON.stringify({ query }),
  });

  console.log('[BTC Page] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('[BTC Page] Response error:', errorText);
    throw new Error(`GraphQL error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[BTC Page] GraphQL result:', JSON.stringify(result, null, 2));

  const supplies: any[] = [];

  // Process each token
  Object.entries(BTC_TOKENS).forEach(([symbol, config]) => {
    const amount = parseFloat(
      result.data?.[symbol]?.aggregate?.sum?.amount || '0'
    );

    supplies.push({
      symbol,
      supply: amount.toString(),
      decimals: config.decimals,
    });
  });

  // Fetch Bitcoin price
  const bitcoinPrice = await fetchBitcoinPrice();

  return {
    supplies: supplies.sort(
      (a, b) => parseFloat(b.supply) - parseFloat(a.supply)
    ),
    timestamp: new Date().toISOString(),
    bitcoinPrice,
  };
}

export default async function Page() {
  try {
    const data = await fetchBTCData();
    console.log('[BTC Page] Passing data to component:', data);
    return <BitcoinPage />;
  } catch (error) {
    console.error('Failed to fetch BTC data:', error);
    // Return page with empty data
    return <BitcoinPage />;
  }
}
