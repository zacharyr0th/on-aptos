// Test script to debug stAPT coin query
const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

const COIN_SUPPLY_QUERY = `
  query GetCoinSupply($coin_type: String!) {
    coin_infos(
      where: { coin_type: { _eq: $coin_type } }
    ) {
      coin_type
      supply_aggregator_table_handle_v1
      supply_aggregator_table_key_v1
      decimals
      name
      symbol
    }
  }
`;

const stAPT_ASSET_TYPE = '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt';

async function testCoinQuery() {
  try {
    console.log('Testing coin query for stAPT...');
    console.log('Asset type:', stAPT_ASSET_TYPE);
    
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'User-Agent': 'Test-Script',
      },
      body: JSON.stringify({
        query: COIN_SUPPLY_QUERY,
        variables: {
          coin_type: stAPT_ASSET_TYPE
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GraphQL Response:', JSON.stringify(result, null, 2));

    if (result.data && result.data.coin_infos && result.data.coin_infos.length > 0) {
      const coinInfo = result.data.coin_infos[0];
      console.log('\nCoin info found:', coinInfo);
      
      if (coinInfo.supply_aggregator_table_handle_v1 && coinInfo.supply_aggregator_table_key_v1) {
        console.log('\nTesting view function...');
        
        const viewResponse = await fetch('https://api.mainnet.aptoslabs.com/v1/view', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            function: "0x1::coin::supply",
            type_arguments: [coinInfo.coin_type],
            arguments: []
          })
        });

        if (viewResponse.ok) {
          const viewResult = await viewResponse.json();
          console.log('View function result:', JSON.stringify(viewResult, null, 2));
        } else {
          console.log('View function failed:', viewResponse.status, viewResponse.statusText);
        }
      } else {
        console.log('No supply aggregator handles found');
      }
    } else {
      console.log('No coin_infos found for this asset type');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCoinQuery();