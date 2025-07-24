#!/usr/bin/env tsx

/**
 * Test the updated Merkle adapter against the verified wallet
 */

import { MerkleTradeAdapter } from '../lib/services/defi/adapters/MerkleTradeAdapter';
import { DefaultPriceService } from '../lib/services/defi/services/DefaultPriceService';

const TARGET_WALLET =
  '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

async function testMerkleAdapter() {
  console.log('🧪 Testing Updated Merkle Adapter');
  console.log('=================================\n');

  try {
    // Create price service
    const priceService = new DefaultPriceService();

    // Create adapter with context
    const adapter = new MerkleTradeAdapter({
      enabled: true,
      priority: 1,
      timeout: 30000,
      retryAttempts: 3,
      cacheTimeToLive: 300000,
    });

    // Set adapter context
    adapter.setContext({
      walletAddress: TARGET_WALLET,
      indexerUrl: 'https://api.mainnet.aptoslabs.com/v1',
      priceService,
      logger: console,
    });

    // Initialize adapter
    await adapter.initialize(adapter.config);

    console.log(`Testing on wallet: ${TARGET_WALLET}\n`);

    // Scan for positions
    const result = await adapter.scanPositions(TARGET_WALLET);

    console.log('📊 RESULTS:');
    console.log(`Found ${result.positions.length} positions\n`);

    if (result.positions.length > 0) {
      for (const position of result.positions) {
        console.log(`💰 ${position.protocol} - ${position.positionType}`);
        console.log(`   Total Value: $${position.totalValueUSD.toFixed(2)}`);
        console.log(`   Assets: ${position.assets.length}`);

        for (const asset of position.assets) {
          console.log(
            `     ${asset.symbol}: ${asset.amount} ($${asset.valueUSD.toFixed(2)})`
          );
          if (asset.metadata) {
            console.log(
              `     Metadata: ${JSON.stringify(asset.metadata, null, 2).substring(0, 200)}...`
            );
          }
        }
        console.log('');
      }
    } else {
      console.log('❌ No positions found');
      console.log("\n🔍 Let's check what resources the adapter is seeing...");

      // Get raw resources to debug
      const response = await fetch(
        `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${TARGET_WALLET}/resources`
      );
      const resources = await response.json();

      console.log(`Total resources in wallet: ${resources.length}`);

      // Filter for Merkle resources
      const merkleResources = resources.filter((r: any) =>
        r.type.includes(
          '5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06'
        )
      );

      console.log(`Merkle-related resources: ${merkleResources.length}`);

      if (merkleResources.length > 0) {
        console.log('\n📋 Merkle resources found:');
        for (const resource of merkleResources.slice(0, 5)) {
          console.log(`   ${resource.type}`);
          if (
            resource.type.includes('MKLP') &&
            resource.data?.coin?.value !== '0'
          ) {
            console.log(`     Balance: ${resource.data.coin.value}`);
          }
        }
      }
    }

    // Show metadata
    console.log('\n📈 Scan Metadata:');
    console.log(`   Adapter: ${result.metadata.adapterId}`);
    console.log(`   Duration: ${result.metadata.scanDuration}ms`);
    console.log(`   Positions Found: ${result.metadata.positionsFound}`);
    console.log(`   Total Value: $${result.metadata.totalValueUSD.toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error testing adapter:', error);
  }
}

if (require.main === module) {
  testMerkleAdapter();
}
