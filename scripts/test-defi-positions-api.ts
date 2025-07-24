#!/usr/bin/env tsx

// Test script to verify DeFi positions detection
import { createDeFiProvider } from '@/lib/services/defi';

async function testDeFiPositions() {
  console.log('Testing DeFi positions detection...');

  // Test with a wallet that's more likely to have DeFi positions
  const testWallets = [
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522', // Original wallet
    '0x1', // Test with a simple address
    '0x2', // Another test address
  ];

  const provider = await createDeFiProvider({
    apiKey: process.env.APTOS_BUILD_SECRET,
    enabledAdapters: [
      'thala-adapter',
      'liquidswap-adapter',
      'pancakeswap-adapter',
      'aries-adapter',
      'cellana-adapter',
      'sushiswap-adapter',
      'merkle-trade-adapter',
      'echelon-adapter',
      'echo-lending-adapter',
      'meso-finance-adapter',
      'joule-finance-adapter',
      'superposition-adapter',
      'vibrantx-adapter',
      'kana-labs-adapter',
      'hyperion-adapter',
      'panora-exchange-adapter',
      'uptos-pump-adapter',
      'thetis-market-adapter',
      'generic-token-adapter',
    ],
  });

  for (const wallet of testWallets) {
    console.log(`\n=== Testing wallet: ${wallet} ===`);

    try {
      const result = await provider.scanPositions(wallet, {
        parallel: true,
        minValueUSD: 0.01,
        includeDust: false,
      });

      console.log(`Found ${result.positions.length} positions`);
      console.log('Summary:', JSON.stringify(result.summary, null, 2));

      if (result.positions.length > 0) {
        console.log('Positions:');
        result.positions.forEach((pos, i) => {
          console.log(
            `  ${i + 1}. ${pos.protocol} - ${pos.positionType} - $${pos.totalValueUSD.toFixed(2)}`
          );
        });
      }
    } catch (error) {
      console.error(`Error scanning wallet ${wallet}:`, error);
    }
  }

  console.log('\n=== Testing complete ===');
}

// Run the test
testDeFiPositions().catch(console.error);
