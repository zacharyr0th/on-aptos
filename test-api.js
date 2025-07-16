// Quick test to check API response structure
const baseUrl = 'http://localhost:3001';

async function testEndpoint(name, path) {
  try {
    const response = await fetch(baseUrl + path);
    const data = await response.json();
    
    console.log(`\n=== ${name} ===`);
    console.log('Status:', response.status);
    console.log('Has data property:', !!data.data);
    console.log('Has cached property:', 'cached' in data);
    
    if (data.data) {
      console.log('Data keys:', Object.keys(data.data));
      if (data.data.supplies) {
        console.log('Supplies length:', data.data.supplies.length);
      }
      if (data.data.protocols) {
        console.log('Protocols length:', data.data.protocols.length);
      }
      if (data.data.total) {
        console.log('Total:', data.data.total);
      }
    }
  } catch (error) {
    console.log(`\n=== ${name} ===`);
    console.log('Error:', error.message);
  }
}

async function main() {
  console.log('Testing API endpoints...');
  
  await testEndpoint('Stablecoins', '/api/aptos/stables');
  await testEndpoint('BTC', '/api/aptos/btc');
  await testEndpoint('LST', '/api/aptos/lst');
  await testEndpoint('RWA', '/api/rwa');
}

main();