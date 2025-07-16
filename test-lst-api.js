const fetch = require('node-fetch');

async function testLSTAPI() {
  try {
    console.log('Testing LST API at http://localhost:3001/api/aptos/lst ...\n');
    
    const response = await fetch('http://localhost:3001/api/aptos/lst');
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log('\nAPI Response Summary:');
      console.log('- Total LST:', data.data.total_formatted || 'N/A');
      console.log('- Token Count:', data.data.supplies?.length || 0);
      console.log('- Debug Info:', data.data.debug || 'N/A');
      
      if (data.data.supplies) {
        console.log('\nToken Supplies:');
        data.data.supplies.forEach(token => {
          console.log(`  - ${token.symbol}: ${token.formatted_supply}`);
        });
      }
    }
  } catch (error) {
    console.error('Error testing LST API:', error.message);
  }
}

testLSTAPI();