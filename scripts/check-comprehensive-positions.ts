#!/usr/bin/env tsx

/**
 * @deprecated This script uses the old ComprehensivePositionChecker which has been integrated into DeFiBalanceService
 * Use test-defi-positions.ts instead for comprehensive position checking
 *
 * Script to check comprehensive protocol positions for a specific wallet
 * Usage: tsx scripts/check-comprehensive-positions.ts
 */

// @ts-ignore - deprecated import
import { ComprehensivePositionChecker } from '../lib/services/comprehensive-position-checker';

async function main() {
  const walletAddress =
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

  console.log('🔍 Checking comprehensive positions for wallet:', walletAddress);
  console.log('='.repeat(80));

  // Initialize the position checker
  const apiKey = process.env.APTOS_BUILD_KEY; // Optional API key
  const checker = new ComprehensivePositionChecker(
    'https://api.mainnet.aptoslabs.com/v1',
    apiKey
  );

  try {
    // Get comprehensive positions
    console.log('📊 Fetching comprehensive positions...');
    const summary = await checker.getComprehensivePositions(walletAddress);

    console.log('\n📈 COMPREHENSIVE POSITION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Wallet: ${summary.walletAddress}`);
    console.log(`Total Active Positions: ${summary.totalActivePositions}`);
    console.log(`Total Protocols: ${summary.totalProtocols}`);
    console.log(`Last Updated: ${summary.lastUpdated}`);

    if (Object.keys(summary.protocolBreakdown).length > 0) {
      console.log('\n🏛️ PROTOCOL BREAKDOWN');
      console.log('='.repeat(50));
      Object.entries(summary.protocolBreakdown).forEach(([protocol, count]) => {
        console.log(
          `${protocol}: ${count} active position${count > 1 ? 's' : ''}`
        );
      });
    }

    if (summary.positions.length > 0) {
      console.log('\n🏦 DETAILED POSITIONS');
      console.log('='.repeat(50));

      // Show active positions first
      const activePositions = summary.positions.filter(p => p.isActive);
      const inactivePositions = summary.positions.filter(p => !p.isActive);

      if (activePositions.length > 0) {
        console.log('\n🟢 ACTIVE POSITIONS');
        console.log('-'.repeat(30));

        activePositions.forEach((position, index) => {
          console.log(
            `\n${index + 1}. ${position.protocol} - ${position.description}`
          );
          console.log(`   Type: ${position.type}`);
          console.log(`   Address: ${position.protocolAddress}`);

          if (position.tokens.length > 0) {
            console.log('   💰 Tokens:');
            position.tokens.forEach((token, i) => {
              const balance = token.balance === '0' ? '0' : token.balance;
              console.log(`     ${i + 1}. ${token.symbol}: ${balance}`);
            });
          }

          if (position.lpTokens.length > 0) {
            console.log('   🏊 LP Tokens:');
            position.lpTokens.forEach((lp, i) => {
              const balance = lp.balance === '0' ? '0' : lp.balance;
              const tokenPair = lp.poolTokens.join('/');
              console.log(
                `     ${i + 1}. ${lp.poolType}: ${tokenPair} (${balance})`
              );
            });
          }

          console.log(`   📋 Resources: ${position.resources.length}`);
        });
      }

      if (inactivePositions.length > 0) {
        console.log('\n🔴 INACTIVE POSITIONS (Previously Used)');
        console.log('-'.repeat(30));

        inactivePositions.forEach((position, index) => {
          console.log(
            `\n${index + 1}. ${position.protocol} - ${position.description}`
          );
          console.log(`   Type: ${position.type}`);
          console.log(`   Address: ${position.protocolAddress}`);

          if (position.lpTokens.length > 0) {
            console.log('   🏊 LP Tokens (Previous):');
            position.lpTokens.forEach((lp, i) => {
              const tokenPair = lp.poolTokens.join('/');
              console.log(`     ${i + 1}. ${lp.poolType}: ${tokenPair}`);
            });
          }

          console.log(`   📋 Resources: ${position.resources.length}`);
        });
      }
    } else {
      console.log('\n❌ No positions found');
    }

    console.log('\n✅ Comprehensive position check completed successfully!');
  } catch (error) {
    console.error('❌ Error checking positions:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
