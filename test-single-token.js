const fetch = require('node-fetch');

async function testSingleToken() {
  const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
  
  // Test one token that should definitely exist - amAPT FA
  const testToken = {
    name: 'amAPT-FA',
    type: '0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62'
  };
  
  console.log(`Testing ${testToken.name} with address: ${testToken.type}\n`);
  
  // First check if the metadata exists
  const metadataQuery = `
    query TestMetadata {
      fungible_asset_metadata(
        where: { asset_type: { _eq: "${testToken.type}" } }
      ) {
        asset_type
        name
        symbol
        decimals
        supply_aggregator_table_handle_v1
        supply_aggregator_table_key_v1
      }
    }
  `;
  
  try {
    console.log('1. Checking metadata...');
    const metaResponse = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'AG-AJXHKGSUNEWR4H3ACAEUK8Z4SJZTJ8XDW'
      },
      body: JSON.stringify({ query: metadataQuery })
    });
    
    const metaData = await metaResponse.json();
    console.log('Metadata response:', JSON.stringify(metaData, null, 2));
    
    if (metaData.data?.fungible_asset_metadata?.length > 0) {
      console.log('✅ Metadata found!');
    } else {
      console.log('❌ No metadata found');
    }
    
  } catch (error) {
    console.error('Metadata error:', error.message);
  }
  
  // Then check balances
  const balanceQuery = `
    query TestBalances {
      current_fungible_asset_balances(
        where: { 
          asset_type: { _eq: "${testToken.type}" },
          amount: { _gt: "0" }
        }
        limit: 10
        order_by: { amount: desc }
      ) {
        amount
        owner_address
      }
    }
  `;
  
  try {
    console.log('\n2. Checking balances...');
    const balanceResponse = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'AG-AJXHKGSUNEWR4H3ACAEUK8Z4SJZTJ8XDW'
      },
      body: JSON.stringify({ query: balanceQuery })
    });
    
    const balanceData = await balanceResponse.json();
    console.log('Balance response:', JSON.stringify(balanceData, null, 2));
    
    if (balanceData.data?.current_fungible_asset_balances?.length > 0) {
      console.log('✅ Balances found!');
      let total = 0n;
      for (const bal of balanceData.data.current_fungible_asset_balances) {
        total += BigInt(bal.amount);
      }
      console.log(`Total from ${balanceData.data.current_fungible_asset_balances.length} addresses: ${total.toString()}`);
    } else {
      console.log('❌ No balances found');
    }
    
  } catch (error) {
    console.error('Balance error:', error.message);
  }
}

testSingleToken();