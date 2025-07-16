#!/usr/bin/env node

async function testFAQuery() {
  const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
  
  // Test one specific FA token that should exist
  const testToken = '0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62'; // amAPT-FA
  
  console.log(`Testing FA query for token: ${testToken}\n`);
  
  const query = `
    query GetFASupply {
      fungible_asset_metadata(
        where: { asset_type: { _eq: "${testToken}" } }
      ) {
        asset_type
        supply_v2
        decimals
        name
        symbol
      }
    }
  `;
  
  try {
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'AG-AJXHKGSUNEWR4H3ACAEUK8Z4SJZTJ8XDW'
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.data?.fungible_asset_metadata?.length > 0) {
      const metadata = data.data.fungible_asset_metadata[0];
      console.log('\n✅ Found FA metadata:');
      console.log(`  Name: ${metadata.name}`);
      console.log(`  Symbol: ${metadata.symbol}`);
      console.log(`  Decimals: ${metadata.decimals}`);
      console.log(`  Supply: ${metadata.supply_v2}`);
      
      if (metadata.supply_v2 && metadata.supply_v2 !== '0') {
        const supply = BigInt(metadata.supply_v2);
        const decimals = metadata.decimals || 8;
        const divisor = BigInt(10 ** decimals);
        const formatted = (supply / divisor).toString();
        console.log(`  Formatted: ${formatted}`);
      }
    } else {
      console.log('❌ No metadata found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFAQuery().catch(console.error);