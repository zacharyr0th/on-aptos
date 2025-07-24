#!/usr/bin/env tsx

/**
 * Test script for the new DeFi Position Provider architecture
 * Usage: tsx scripts/test-defi-provider.ts
 */

import { createDeFiProvider } from '../lib/services/defi';

async function main() {
  const walletAddress =
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

  console.log('🔍 Testing New DeFi Position Provider');
  console.log('Wallet:', walletAddress);
  console.log('='.repeat(80));

  try {
    // Create provider with default configuration
    console.log('📦 Creating DeFi provider...');
    const provider = createDeFiProvider({
      apiKey: process.env.APTOS_BUILD_SECRET,
      enabledAdapters: ['thala-adapter', 'generic-token-adapter'],
    });

    // Initialize all adapters
    console.log('🔧 Initializing adapters...');
    await provider.initializeAllAdapters();

    // Check provider health
    console.log('❤️  Checking provider health...');
    const health = provider.getProviderHealth();
    console.log(`Provider Status: ${health.status}`);
    console.log(`Active Adapters: ${health.totalActiveAdapters}`);

    health.adapters.forEach(adapter => {
      console.log(`  - ${adapter.name}: ${adapter.status}`);
      if (adapter.issues) {
        adapter.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
      }
    });

    // Get registry stats
    const stats = provider.getRegistryStats();
    console.log('\n📊 Registry Stats:');
    console.log(`Total Adapters: ${stats.total}`);
    console.log(`Enabled: ${stats.enabled}`);
    console.log(`Disabled: ${stats.disabled}`);

    // Scan positions
    console.log('\n🔍 Scanning DeFi positions...');
    const startTime = Date.now();

    const result = await provider.scanPositions(walletAddress, {
      parallel: true,
      timeout: 30000,
      minValueUSD: 0.01,
      includeDust: false,
    });

    const scanDuration = Date.now() - startTime;

    console.log('\n📈 SCAN RESULTS');
    console.log('='.repeat(50));
    console.log(`Scan Duration: ${scanDuration}ms`);
    console.log(`Total Positions: ${result.summary.totalPositions}`);
    console.log(`Total Value USD: $${result.summary.totalValueUSD.toFixed(2)}`);
    console.log(`Adapters Used: ${result.metadata.adaptersUsed.join(', ')}`);

    // Protocol breakdown
    if (Object.keys(result.summary.protocolBreakdown).length > 0) {
      console.log('\n🏛️ PROTOCOL BREAKDOWN');
      console.log('-'.repeat(30));
      Object.entries(result.summary.protocolBreakdown).forEach(
        ([protocol, value]) => {
          console.log(`${protocol}: $${value.toFixed(2)}`);
        }
      );
    }

    // Top protocols
    if (result.summary.topProtocols.length > 0) {
      console.log('\n🏆 TOP PROTOCOLS');
      console.log('-'.repeat(30));
      result.summary.topProtocols.forEach((protocol, index) => {
        console.log(
          `${index + 1}. ${protocol.protocol}: $${protocol.valueUSD.toFixed(2)} (${protocol.percentage.toFixed(1)}%)`
        );
      });
    }

    // Position details
    if (result.positions.length > 0) {
      console.log('\n💰 DETAILED POSITIONS');
      console.log('-'.repeat(30));

      result.positions
        .sort((a, b) => b.totalValueUSD - a.totalValueUSD)
        .slice(0, 10) // Show top 10
        .forEach((position, index) => {
          console.log(
            `\n${index + 1}. ${position.protocol} - ${position.positionType}`
          );
          console.log(`   ID: ${position.id}`);
          console.log(`   Total Value: $${position.totalValueUSD.toFixed(2)}`);

          if (position.assets.length > 0) {
            console.log('   Assets:');
            position.assets.forEach((asset, i) => {
              console.log(`     ${i + 1}. ${asset.symbol} (${asset.type})`);
              console.log(`        Amount: ${asset.amount}`);
              console.log(`        Value: $${asset.valueUSD.toFixed(2)}`);

              if (asset.metadata) {
                if (asset.metadata.poolId) {
                  console.log(
                    `        Pool: ${asset.metadata.poolId.substring(0, 20)}...`
                  );
                }
                if (asset.metadata.poolTokens) {
                  console.log(
                    `        Pool Tokens: ${asset.metadata.poolTokens.join(', ')}`
                  );
                }
                if (asset.metadata.apy) {
                  console.log(`        APY: ${asset.metadata.apy}%`);
                }
              }
            });
          }

          if (position.metadata) {
            console.log(`   Last Updated: ${position.lastUpdated}`);
            if (position.metadata.tokenStandard) {
              console.log(
                `   Token Standard: ${position.metadata.tokenStandard}`
              );
            }
          }
        });

      if (result.positions.length > 10) {
        console.log(`\n... and ${result.positions.length - 10} more positions`);
      }
    } else {
      console.log('\n❌ No DeFi positions found');
    }

    // Test individual adapters
    console.log('\n🔧 ADAPTER PERFORMANCE');
    console.log('-'.repeat(30));

    const adapters = provider.getRegisteredAdapters();
    for (const adapter of adapters) {
      console.log(`\n${adapter.name} (${adapter.id}):`);
      console.log(`  Total Requests: ${adapter.metrics.totalRequests}`);
      console.log(
        `  Success Rate: ${
          adapter.metrics.totalRequests > 0
            ? (
                (adapter.metrics.successfulRequests /
                  adapter.metrics.totalRequests) *
                100
              ).toFixed(1)
            : 0
        }%`
      );
      console.log(
        `  Avg Response Time: ${adapter.metrics.averageResponseTime.toFixed(0)}ms`
      );

      if (adapter.metrics.lastError) {
        console.log(`  Last Error: ${adapter.metrics.lastError}`);
      }
    }

    console.log('\n✅ DeFi provider test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing DeFi provider:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
