const fetch = require('node-fetch');

async function testRWAAPI() {
  try {
    console.log('Testing RWA API at http://localhost:3001/api/rwa ...\n');
    
    const response = await fetch('http://localhost:3001/api/rwa');
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log('\nAPI Response Summary:');
      console.log('- Success:', data.data.success || false);
      console.log('- Total RWA Value:', data.data.totalAptosValueFormatted || 'N/A');
      console.log('- Asset Count:', data.data.assetCount || 0);
      console.log('- Data Source:', data.data.dataSource || 'Unknown');
      console.log('- Protocols:', data.data.protocols?.length || 0);
    }
  } catch (error) {
    console.error('Error testing RWA API:', error.message);
  }
}

testRWAAPI();