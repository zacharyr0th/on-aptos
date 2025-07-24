#!/usr/bin/env tsx

/**
 * Script to test DeFi positions for the portfolio page
 * Usage: tsx scripts/test-defi-positions.ts
 */

import { DeFiBalanceService } from '../lib/services/portfolio/defi-balance-service';

async function main() {
  const walletAddress =
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

  console.log('🔍 Testing DeFi positions for portfolio page');
  console.log('Wallet:', walletAddress);
  console.log('='.repeat(80));

  try {
    // Test DeFi positions
    console.log('📊 Fetching DeFi positions...');
    const positions = await DeFiBalanceService.getDeFiPositions(walletAddress);

    console.log('\n📈 DEFI POSITIONS');
    console.log('='.repeat(50));
    console.log(`Total positions: ${positions.length}`);

    if (positions.length > 0) {
      positions.forEach((position, index) => {
        console.log(
          `\n${index + 1}. ${position.protocol} (${position.protocolType})`
        );
        console.log(`   Label: ${position.protocolLabel}`);
        console.log(`   Address: ${position.address}`);
        console.log(`   Total Value: $${position.totalValue.toFixed(2)}`);

        // Show position details
        const pos = position.position;

        if (pos.liquidity && pos.liquidity.length > 0) {
          console.log('   💧 Liquidity:');
          pos.liquidity.forEach((liq, i) => {
            console.log(
              `     ${i + 1}. ${liq.token0.symbol}/${liq.token1.symbol} (${liq.poolId})`
            );
            console.log(`        LP Tokens: ${liq.lpTokens}`);
          });
        }

        if (pos.staked && pos.staked.length > 0) {
          console.log('   🥩 Staked:');
          pos.staked.forEach((stake, i) => {
            console.log(`     ${i + 1}. ${stake.symbol}: ${stake.amount}`);
          });
        }

        if (pos.supplied && pos.supplied.length > 0) {
          console.log('   💰 Supplied:');
          pos.supplied.forEach((supply, i) => {
            console.log(`     ${i + 1}. ${supply.symbol}: ${supply.amount}`);
          });
        }
      });
    } else {
      console.log('❌ No DeFi positions found');
    }

    // Test DeFi stats
    console.log('\n📊 Fetching DeFi stats...');
    const stats = await DeFiBalanceService.getDeFiStats(walletAddress);

    console.log('\n📈 DEFI STATS');
    console.log('='.repeat(50));
    console.log(`Total Positions: ${stats.totalPositions}`);
    console.log(`Total Value Locked: $${stats.totalValueLocked.toFixed(2)}`);

    if (stats.topProtocols.length > 0) {
      console.log('\nTop Protocols:');
      stats.topProtocols.forEach((protocol, index) => {
        console.log(
          `${index + 1}. ${protocol.protocol}: $${protocol.value.toFixed(2)} (${protocol.percentage.toFixed(1)}%)`
        );
      });
    }

    if (Object.keys(stats.protocolBreakdown).length > 0) {
      console.log('\nProtocol Breakdown:');
      Object.entries(stats.protocolBreakdown).forEach(([type, value]) => {
        console.log(`${type}: $${value.toFixed(2)}`);
      });
    }

    console.log('\n✅ DeFi positions test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing DeFi positions:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
