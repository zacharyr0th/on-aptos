#!/usr/bin/env tsx

/**
 * Script to test ALL DeFi protocol coverage
 * Usage: tsx scripts/test-all-protocols.ts
 */

import { ComprehensivePositionChecker } from '../lib/services/comprehensive-position-checker';
import { PROTOCOLS_BY_TYPE, PROTOCOL_ADDRESSES } from '../lib/aptos-constants';
import { PROTOCOLS } from '../lib/protocol-registry';

async function main() {
  const walletAddress = '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';
  
  console.log('🔍 Testing ALL DeFi Protocol Coverage');
  console.log('Wallet:', walletAddress);
  console.log('=' .repeat(80));

  // Show all protocols being monitored
  console.log('\n📋 ALL PROTOCOLS BEING MONITORED:');
  console.log('=' .repeat(50));
  
  const allProtocols = Object.values(PROTOCOLS);
  const protocolsByType = {
    LIQUID_STAKING: allProtocols.filter(p => p.type === 'liquid_staking'),
    LENDING: allProtocols.filter(p => p.type === 'lending'), 
    DEX: allProtocols.filter(p => p.type === 'dex'),
    FARMING: allProtocols.filter(p => p.type === 'farming'),
    DERIVATIVES: allProtocols.filter(p => p.type === 'derivatives'),
    BRIDGE: allProtocols.filter(p => p.type === 'bridge'),
    INFRASTRUCTURE: allProtocols.filter(p => p.type === 'infrastructure'),
    NFT_MARKETPLACE: allProtocols.filter(p => p.type === 'nft_marketplace'),
  };

  let totalProtocols = 0;
  let totalAddresses = 0;

  Object.entries(protocolsByType).forEach(([type, protocols]) => {
    if (protocols.length > 0) {
      console.log(`\n🏷️  ${type.replace('_', ' ')} (${protocols.length} protocols):`);
      protocols.forEach(protocol => {
        console.log(`   • ${protocol.name} (${protocol.addresses.length} addresses)`);
        totalAddresses += protocol.addresses.length;
      });
      totalProtocols += protocols.length;
    }
  });

  console.log(`\n📊 TOTAL COVERAGE: ${totalProtocols} protocols, ${totalAddresses} addresses`);

  // Test comprehensive position checker
  console.log('\n🔍 TESTING COMPREHENSIVE POSITION CHECKER:');
  console.log('=' .repeat(50));

  try {
    const checker = new ComprehensivePositionChecker(
      'https://api.mainnet.aptoslabs.com/v1',
      process.env.APTOS_BUILD_KEY
    );

    const summary = await checker.getComprehensivePositions(walletAddress);
    
    console.log(`\n📈 RESULTS:`);
    console.log(`Total Active Positions: ${summary.totalActivePositions}`);
    console.log(`Total Protocols Found: ${summary.totalProtocols}`);
    console.log(`Last Updated: ${summary.lastUpdated}`);

    if (Object.keys(summary.protocolBreakdown).length > 0) {
      console.log('\n🏛️ PROTOCOL BREAKDOWN:');
      Object.entries(summary.protocolBreakdown).forEach(([protocol, count]) => {
        console.log(`${protocol}: ${count} position${count > 1 ? 's' : ''}`);
      });
    }

    console.log('\n📋 DETAILED POSITIONS:');
    summary.positions
      .filter(p => p.isActive)
      .forEach((position, index) => {
        console.log(`\n${index + 1}. ${position.protocol}`);
        console.log(`   Type: ${position.type}`);
        console.log(`   Description: ${position.description}`);
        console.log(`   Address: ${position.protocolAddress}`);
        console.log(`   Active: ${position.isActive ? '✅' : '❌'}`);
        
        if (position.tokens.length > 0) {
          console.log(`   Tokens: ${position.tokens.length}`);
          position.tokens.forEach(token => {
            if (token.balance !== '0') {
              console.log(`     • ${token.symbol}: ${token.balance}`);
            }
          });
        }
        
        if (position.lpTokens.length > 0) {
          console.log(`   LP Tokens: ${position.lpTokens.length}`);
          position.lpTokens.forEach(lp => {
            if (lp.balance !== '0') {
              console.log(`     • ${lp.poolType}: ${lp.poolTokens.join('/')}`);
            }
          });
        }
      });

    // Check coverage
    const detectedProtocols = new Set(summary.positions.map(p => p.protocol));
    const expectedProtocols = new Set(allProtocols.map(p => p.name));
    
    console.log('\n📊 COVERAGE ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Protocols with positions: ${detectedProtocols.size}`);
    console.log(`Total protocols monitored: ${expectedProtocols.size}`);
    console.log(`Coverage: ${((detectedProtocols.size / expectedProtocols.size) * 100).toFixed(1)}%`);

    if (detectedProtocols.size > 0) {
      console.log('\n✅ PROTOCOLS WITH POSITIONS:');
      Array.from(detectedProtocols).sort().forEach(protocol => {
        console.log(`   • ${protocol}`);
      });
    }

    console.log('\n✅ All protocol coverage test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing protocol coverage:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);