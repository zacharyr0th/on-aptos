#!/usr/bin/env tsx

/**
 * Test script for portfolio DeFi integration
 * Usage: tsx scripts/test-portfolio-defi.ts
 */

import { DeFiService } from '../lib/services/portfolio/services/defi-service';

async function main() {
  const walletAddress =
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

  console.log('🔍 Testing Portfolio DeFi Integration');
  console.log('Wallet:', walletAddress);
  console.log('='.repeat(80));

  try {
    // Test 1: Get DeFi positions
    console.log('\n📊 Fetching DeFi positions through portfolio service...');
    const positions = await DeFiService.getWalletDeFiPositions(walletAddress);

    console.log(`\nFound ${positions.length} positions\n`);

    positions.forEach((position, index) => {
      console.log(
        `${index + 1}. ${position.protocol} (${position.protocolType})`
      );
      console.log(`   Position Type: ${position.positionType}`);
      console.log(`   Total Value: $${position.totalValueUSD.toFixed(2)}`);

      if (position.suppliedAssets.length > 0) {
        console.log('   Supplied Assets:');
        position.suppliedAssets.forEach((asset, i) => {
          console.log(`     ${i + 1}. Amount: ${asset.amount}`);
          console.log(`        Value: $${asset.value.toFixed(2)}`);
          console.log(`        Asset: ${asset.asset.substring(0, 50)}...`);
        });
      }

      if (position.borrowedAssets.length > 0) {
        console.log('   Borrowed Assets:');
        position.borrowedAssets.forEach((asset, i) => {
          console.log(`     ${i + 1}. Amount: ${asset.amount}`);
          console.log(`        Value: $${asset.value.toFixed(2)}`);
        });
      }

      console.log('');
    });

    // Test 2: Get metrics
    console.log('📈 Calculating DeFi metrics...');
    const metrics = await DeFiService.calculateDeFiMetrics(positions);

    console.log('\nMETRICS:');
    console.log(`Total Value Locked: $${metrics.totalValueLocked.toFixed(2)}`);
    console.log(`Total Supplied: $${metrics.totalSupplied.toFixed(2)}`);
    console.log(`Total Borrowed: $${metrics.totalBorrowed.toFixed(2)}`);
    console.log(`Net APY: ${metrics.netAPY.toFixed(2)}%`);
    console.log(`Protocols: ${metrics.protocols.join(', ')}`);

    // Test 3: Get summary
    console.log('\n📊 Getting DeFi summary...');
    const summary = await DeFiService.getDeFiSummary(walletAddress);

    console.log('\nSUMMARY:');
    console.log(`Total Positions: ${summary.totalPositions}`);
    console.log(`Total Value USD: $${summary.totalValueUSD.toFixed(2)}`);

    if (Object.keys(summary.protocolBreakdown).length > 0) {
      console.log('\nProtocol Breakdown:');
      Object.entries(summary.protocolBreakdown).forEach(([protocol, value]) => {
        console.log(`  ${protocol}: $${value.toFixed(2)}`);
      });
    }

    if (summary.topProtocols.length > 0) {
      console.log('\nTop Protocols:');
      summary.topProtocols.forEach((p, i) => {
        console.log(
          `  ${i + 1}. ${p.protocol}: $${p.valueUSD.toFixed(2)} (${p.percentage.toFixed(1)}%)`
        );
      });
    }

    // Test 4: Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const apiUrl = `http://localhost:3000/api/portfolio/defi?walletAddress=${walletAddress}`;

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response Status: SUCCESS');
        console.log(`API Positions Count: ${data.data?.totalCount || 0}`);
        console.log(`Has Metrics: ${!!data.data?.metrics}`);
        console.log(`Has Summary: ${!!data.data?.summary}`);
      } else {
        console.log('API Response Status:', response.status);
        console.log('API Error:', await response.text());
      }
    } catch (apiError) {
      console.log('API Test Skipped: Server not running');
    }

    console.log('\n✅ Portfolio DeFi integration test completed!');
  } catch (error) {
    console.error('❌ Error testing portfolio DeFi integration:', error);

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
