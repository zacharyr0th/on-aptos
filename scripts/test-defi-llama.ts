#!/usr/bin/env tsx

/**
 * Test script for DeFi Llama integration
 * Run with: npx tsx scripts/test-defi-llama.ts
 */

import { defiLlamaService } from '../lib/services/defi-llama';
import { defiProtocolSyncService } from '../lib/services/defi-protocol-sync';

async function testDefiLlamaIntegration() {
  console.log('🦙 Testing DeFi Llama Integration\n');

  try {
    // Test 1: Get Aptos chain data
    console.log('1. Testing Aptos chain data...');
    const chainData = await defiLlamaService.getAptosChainData();
    console.log('Chain data:', chainData);

    // Test 2: Get Aptos volume data
    console.log('\n2. Testing Aptos volume data...');
    const volumeData = await defiLlamaService.getAptosVolumeData();
    console.log('Volume data:', volumeData);

    // Test 3: Get Aptos fees data
    console.log('\n3. Testing Aptos fees data...');
    const feesData = await defiLlamaService.getAptosFeesData();
    console.log('Fees data:', feesData);

    // Test 4: Get comprehensive metrics
    console.log('\n4. Testing comprehensive metrics...');
    const metrics = await defiLlamaService.getAptosDefiMetrics();
    console.log('Comprehensive metrics:', JSON.stringify(metrics, null, 2));

    // Test 5: Get Aptos protocols
    console.log('\n5. Testing Aptos protocols list...');
    const protocols = await defiLlamaService.getAptosProtocols();
    console.log(`Found ${protocols.length} protocols on Aptos:`);
    protocols.slice(0, 5).forEach(p => {
      console.log(`- ${p.name}: $${(p.tvl / 1e6).toFixed(1)}M TVL`);
    });

    // Test 6: Test protocol sync service
    console.log('\n6. Testing protocol sync service...');
    const trackedProtocols = defiProtocolSyncService.getTrackedProtocols();
    console.log('Tracked protocols:', trackedProtocols);

    if (trackedProtocols.length > 0) {
      const protocolUpdate = await defiProtocolSyncService.getProtocolUpdate(
        trackedProtocols[0]
      );
      console.log(`Update for ${trackedProtocols[0]}:`, protocolUpdate);
    }

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDefiLlamaIntegration();
