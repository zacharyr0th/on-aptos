const fetch = require('node-fetch');

async function testAptosIndexer() {
  const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
  
  // Test token - amAPT
  const testQuery = `
    query TokenBalances($type: String!) {
      current_fungible_asset_balances(
        where: { asset_type: { _eq: $type } }
        limit: 10
      ) {
        amount
        owner_address
      }
    }
  `;
  
  const variables = {
    type: '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt'
  };
  
  try {
    console.log('Testing Aptos Indexer GraphQL endpoint...\n');
    console.log('URL:', INDEXER_URL);
    console.log('Query:', testQuery);
    console.log('Variables:', JSON.stringify(variables, null, 2));
    
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        variables: variables
      })
    });
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data?.current_fungible_asset_balances) {
      console.log('\nFound', data.data.current_fungible_asset_balances.length, 'balances');
      
      // Calculate total
      let total = 0n;
      for (const balance of data.data.current_fungible_asset_balances) {
        if (balance.amount) {
          total += BigInt(balance.amount);
        }
      }
      console.log('Total amount:', total.toString());
    }
    
  } catch (error) {
    console.error('Error testing Aptos Indexer:', error);
  }
}

testAptosIndexer();