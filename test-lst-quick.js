const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/aptos/lst',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

console.log('Testing LST API at http://localhost:3001/api/aptos/lst...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('\n--- Response Body ---');
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.data) {
        console.log('\n--- Summary ---');
        console.log(`Total: ${parsed.data.total_formatted || 'N/A'}`);
        console.log(`Token count: ${parsed.data.supplies?.length || 0}`);
        if (parsed.data.supplies) {
          console.log('Supplies:');
          parsed.data.supplies.forEach(s => {
            console.log(`  ${s.symbol}: ${s.formatted_supply}`);
          });
        }
      }
    } catch (e) {
      console.log('Raw response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();