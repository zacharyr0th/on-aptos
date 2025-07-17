#!/usr/bin/env node

/**
 * Test script to verify all API endpoints are working correctly
 * Usage: node scripts/test-production-endpoints.js [production-url]
 */

const baseUrl = process.argv[2] || 'http://localhost:3001';

const endpoints = [
  { name: 'Stablecoins', path: '/api/aptos/stables' },
  { name: 'Bitcoin', path: '/api/aptos/btc' },
  { name: 'LST', path: '/api/aptos/lst' },
  { name: 'RWA', path: '/api/rwa' },
];

async function testEndpoint(name, url) {
  console.log(`\n📡 Testing ${name} endpoint...`);
  console.log(`   URL: ${url}`);

  try {
    const start = Date.now();
    const response = await fetch(url);
    const elapsed = Date.now() - start;

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response time: ${elapsed}ms`);

    if (response.ok) {
      const data = await response.json();

      // Check if data is properly structured
      if (data.data) {
        console.log(`   ✅ Data structure: Valid (data property exists)`);

        // Check specific fields based on endpoint
        if (name === 'Stablecoins' || name === 'Bitcoin' || name === 'LST') {
          const hasSupplies =
            data.data.supplies && Array.isArray(data.data.supplies);
          console.log(
            `   ✅ Supplies: ${hasSupplies ? data.data.supplies.length + ' items' : 'Missing!'}`
          );
          console.log(`   ✅ Total: ${data.data.total || 'Missing!'}`);
        } else if (name === 'RWA') {
          const hasProtocols =
            data.data.protocols && Array.isArray(data.data.protocols);
          console.log(
            `   ✅ Protocols: ${hasProtocols ? data.data.protocols.length + ' items' : 'Missing!'}`
          );
          console.log(
            `   ✅ Total Value: ${data.data.totalAptosValue || 'Missing!'}`
          );
        }
      } else {
        console.log(`   ❌ Data structure: Invalid (missing data property)`);
      }

      return true;
    } else {
      const errorData = await response.text();
      console.log(`   ❌ Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`🚀 Testing API endpoints at ${baseUrl}`);
  console.log('='.repeat(50));

  let successCount = 0;

  for (const { name, path } of endpoints) {
    const success = await testEndpoint(name, baseUrl + path);
    if (success) successCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(
    `\n📊 Summary: ${successCount}/${endpoints.length} endpoints working`
  );

  if (successCount === endpoints.length) {
    console.log('✅ All endpoints are working correctly!');
  } else {
    console.log('❌ Some endpoints are failing. Please check the logs above.');
    process.exit(1);
  }
}

main().catch(console.error);
