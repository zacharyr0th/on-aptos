#!/usr/bin/env node

async function testTokenMetadata() {
  const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
  
  // Test tokens from our config
  const testTokens = [
    { name: 'amAPT (Coin)', type: '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt' },
    { name: 'amAPT (FA)', type: '0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62' },
    { name: 'stAPT (Coin)', type: '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt' },
    { name: 'stAPT (FA)', type: '0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627' },
    { name: 'kAPT (FA)', type: '0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105' },
    { name: 'truAPT (FA)', type: '0xaef6a8c3182e076db72d64324617114cacf9a52f28325edc10b483f7f05da0e7' },
  ];
  
  console.log('Testing token metadata existence...\n');
  
  for (const token of testTokens) {
    console.log(`🔍 Testing ${token.name}`);
    console.log(`   Address: ${token.type}`);
    
    // Check if it's a coin type or FA type
    const isCoinType = token.type.includes('::');
    
    if (isCoinType) {
      // Test coin metadata
      const coinQuery = `
        query TestCoinMetadata {
          coin_infos(where: { coin_type: { _eq: "${token.type}" } }) {
            coin_type
            name
            symbol
            decimals
            supply_aggregator_table_handle_v1
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
          body: JSON.stringify({ query: coinQuery })
        });
        
        const data = await response.json();
        
        if (data.data?.coin_infos?.length > 0) {
          console.log(`   ✅ Coin metadata found: ${data.data.coin_infos[0].symbol}`);
        } else {
          console.log(`   ❌ No coin metadata found`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking coin metadata: ${error.message}`);
      }
    } else {
      // Test FA metadata
      const faQuery = `
        query TestFAMetadata {
          fungible_asset_metadata(where: { asset_type: { _eq: "${token.type}" } }) {
            asset_type
            name
            symbol
            decimals
            supply_aggregator_table_handle_v1
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
          body: JSON.stringify({ query: faQuery })
        });
        
        const data = await response.json();
        
        if (data.data?.fungible_asset_metadata?.length > 0) {
          console.log(`   ✅ FA metadata found: ${data.data.fungible_asset_metadata[0].symbol}`);
        } else {
          console.log(`   ❌ No FA metadata found`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking FA metadata: ${error.message}`);
      }
    }
    
    console.log();
  }
}

testTokenMetadata().catch(console.error);