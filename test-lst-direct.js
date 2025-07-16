const fetch = require('node-fetch');

async function testLSTQueries() {
  const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
  
  // Test tokens - one coin and one FA from each protocol
  const testTokens = [
    { name: 'amAPT (coin)', type: '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt' },
    { name: 'amAPT (FA)', type: '0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62' },
    { name: 'thAPT (coin)', type: '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT' },
    { name: 'thAPT (FA)', type: '0xa0d9d647c5737a5aed08d2cfeb39c31cf901d44bc4aa024eaa7e5e68b804e011' },
    { name: 'kAPT (FA)', type: '0x821c94e69bc7ca058c913b7b5e6b0a5c9fd1523d58723a966fb8c1f5ea888105' }
  ];
  
  console.log('Testing LST token queries to Aptos Indexer...\n');
  
  for (const token of testTokens) {
    console.log(`\n========== Testing ${token.name} ==========`);
    console.log(`Asset type: ${token.type}`);
    
    try {
      // Query for balances
      const balanceQuery = `
        query TestQuery {
          current_fungible_asset_balances(
            where: { 
              asset_type: { _eq: "${token.type}" },
              amount: { _gt: "0" }
            }
            limit: 5
            order_by: { amount: desc }
          ) {
            amount
            owner_address
          }
        }
      `;
      
      const response = await fetch(INDEXER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: balanceQuery })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.log('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
      }
      
      if (data.data?.current_fungible_asset_balances) {
        const balances = data.data.current_fungible_asset_balances;
        console.log(`Found ${balances.length} balances`);
        
        if (balances.length > 0) {
          // Calculate total
          let total = 0n;
          for (const balance of balances) {
            total += BigInt(balance.amount);
          }
          console.log(`Total supply (top ${balances.length}): ${total.toString()}`);
          console.log('Sample balances:');
          balances.slice(0, 3).forEach(b => {
            console.log(`  - ${b.owner_address.substring(0, 10)}...: ${b.amount}`);
          });
        }
      } else {
        console.log('No balance data returned');
      }
      
      // Also check metadata
      const metadataQuery = `
        query TestMetadata {
          fungible_asset_metadata(
            where: { asset_type: { _eq: "${token.type}" } }
          ) {
            asset_type
            name
            symbol
            decimals
          }
        }
      `;
      
      const metaResponse = await fetch(INDEXER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: metadataQuery })
      });
      
      const metaData = await metaResponse.json();
      
      if (metaData.data?.fungible_asset_metadata?.length > 0) {
        const meta = metaData.data.fungible_asset_metadata[0];
        console.log('Metadata found:', {
          name: meta.name,
          symbol: meta.symbol,
          decimals: meta.decimals
        });
      } else {
        console.log('No metadata found');
      }
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  console.log('\n\nNow testing with aggregate query...\n');
  
  // Test aggregate query
  for (const token of testTokens.slice(0, 2)) { // Just test first two
    console.log(`\n========== Aggregate for ${token.name} ==========`);
    
    const aggregateQuery = `
      query AggregateTest {
        current_fungible_asset_balances_aggregate(
          where: { asset_type: { _eq: "${token.type}" } }
        ) {
          aggregate {
            sum {
              amount
            }
            count
          }
        }
      }
    `;
    
    try {
      const response = await fetch(INDEXER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: aggregateQuery })
      });
      
      const data = await response.json();
      console.log('Aggregate response:', JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('Aggregate error:', error.message);
    }
  }
}

testLSTQueries();