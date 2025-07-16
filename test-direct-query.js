const fetch = require('node-fetch');

async function testDirectQuery() {
  const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
  
  // Test with a known token
  const query = `
    query TestQuery {
      current_fungible_asset_balances(
        where: { 
          asset_type: { _eq: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt" }
        }
        limit: 5
      ) {
        amount
        owner_address
        asset_type
      }
    }
  `;
  
  try {
    console.log('Testing direct query to Aptos Indexer...\n');
    
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Also test if the asset exists at all
    const metadataQuery = `
      query TestMetadata {
        fungible_asset_metadata(
          where: { 
            asset_type: { _eq: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt" }
          }
        ) {
          asset_type
          name
          symbol
          decimals
        }
      }
    `;
    
    console.log('\n\nTesting metadata query...\n');
    const metaResponse = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: metadataQuery })
    });
    
    const metaData = await metaResponse.json();
    console.log('Metadata Response:', JSON.stringify(metaData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectQuery();