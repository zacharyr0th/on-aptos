#!/usr/bin/env tsx

/**
 * @deprecated This script uses the old ThalaPositionChecker which has been replaced by DeFiBalanceService
 * Use test-defi-positions.ts instead for checking Thala positions
 *
 * Script to check Thala protocol positions for a specific wallet
 * Usage: tsx scripts/check-thala-positions.ts
 */

// @ts-ignore - deprecated import
import { ThalaPositionChecker } from '../lib/services/thala-position-checker';

async function main() {
  const walletAddress =
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

  console.log('🔍 Checking Thala positions for wallet:', walletAddress);
  console.log('='.repeat(80));

  // Initialize the position checker
  const apiKey = process.env.APTOS_BUILD_KEY; // Optional API key
  const checker = new ThalaPositionChecker(
    'https://api.mainnet.aptoslabs.com/v1',
    apiKey
  );

  try {
    // Check for Thala positions
    console.log('📊 Fetching Thala positions...');
    const positions = await checker.checkWalletPositions(walletAddress);

    console.log('\n📈 THALA POSITION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Wallet: ${positions.walletAddress}`);
    console.log(`Total Positions: ${positions.totalPositions}`);
    console.log(
      `Active Protocols: ${positions.protocolsActive.join(', ') || 'None'}`
    );
    console.log(`Last Updated: ${positions.lastUpdated}`);

    if (positions.positions.length > 0) {
      console.log('\n🏦 DETAILED POSITIONS');
      console.log('='.repeat(50));

      positions.positions.forEach((position, index) => {
        console.log(`\n${index + 1}. ${position.protocol} (${position.type})`);
        console.log(`   Address: ${position.address}`);
        console.log(`   Resources: ${position.resources.length}`);
        console.log(`   Transactions: ${position.transactions.length}`);

        if (position.resources.length > 0) {
          console.log('   📋 Resources:');
          position.resources.forEach((resource, i) => {
            console.log(`     ${i + 1}. ${resource.type}`);
            console.log(
              `        Data: ${JSON.stringify(resource.data, null, 2).substring(0, 200)}...`
            );
          });
        }

        if (position.transactions.length > 0) {
          console.log('   📝 Recent Transactions:');
          position.transactions.slice(0, 3).forEach((tx, i) => {
            console.log(`     ${i + 1}. ${tx.hash} (${tx.timestamp})`);
            console.log(`        Success: ${tx.success}, Type: ${tx.type}`);
          });
        }
      });
    } else {
      console.log('\n❌ No Thala positions found');
    }

    // Check for specific Thala token holdings
    console.log('\n🪙 THALA TOKEN HOLDINGS');
    console.log('='.repeat(50));

    const tokenHoldings = await checker.checkThalaTokenHoldings(walletAddress);

    if (tokenHoldings.length > 0) {
      tokenHoldings.forEach((holding, index) => {
        console.log(`${index + 1}. ${holding.token}`);
        console.log(`   Balance: ${holding.balance}`);
        console.log(`   Type: ${holding.type}`);
      });
    } else {
      console.log('❌ No Thala token holdings found');
    }

    console.log('\n✅ Position check completed successfully!');
  } catch (error) {
    console.error('❌ Error checking positions:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
