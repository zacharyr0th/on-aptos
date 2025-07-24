#!/usr/bin/env tsx

/**
 * Test if the Merkle adapter exclusion fix works
 */

import { MerkleTradeAdapter } from '../lib/services/defi/adapters/MerkleTradeAdapter';
import { GenericTokenAdapter } from '../lib/services/defi/adapters/GenericTokenAdapter';
import { DefaultPriceService } from '../lib/services/defi/services/DefaultPriceService';

const TARGET_WALLET = '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

async function testBothAdapters() {
  console.log('🧪 Testing Merkle vs Generic Adapter Exclusion');
  console.log('===============================================\n');

  try {
    const priceService = new DefaultPriceService();

    // Test MKLP token address exclusion
    console.log('🔍 Testing MKLP token address filtering...');
    
    const genericAdapter = new GenericTokenAdapter();
    
    // Test if GenericTokenAdapter would exclude MKLP tokens
    const mklpTokenAddress1 = '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>';
    const mklpTokenAddress2 = '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP<0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::fa_box::W_USDC>';
    
    // Access private method for testing
    const isCommonToken = (genericAdapter as any).isCommonToken.bind(genericAdapter);
    
    const shouldExclude1 = isCommonToken(mklpTokenAddress1);
    const shouldExclude2 = isCommonToken(mklpTokenAddress2);
    
    console.log(`MKLP Token 1 excluded: ${shouldExclude1}`);
    console.log(`MKLP Token 2 excluded: ${shouldExclude2}`);
    
    if (shouldExclude1 && shouldExclude2) {
      console.log('✅ GenericTokenAdapter will correctly exclude MKLP tokens');
    } else {
      console.log('❌ GenericTokenAdapter exclusion not working properly');
    }

    // Test other common tokens are still excluded
    const aptToken = '0x1::aptos_coin::AptosCoin';
    const usdcToken = '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC';
    
    const shouldExcludeAPT = isCommonToken(aptToken);
    const shouldExcludeUSDC = isCommonToken(usdcToken);
    
    console.log(`APT excluded: ${shouldExcludeAPT}`);
    console.log(`USDC excluded: ${shouldExcludeUSDC}`);
    
    if (shouldExcludeAPT && shouldExcludeUSDC) {
      console.log('✅ Common tokens still properly excluded');
    } else {
      console.log('❌ Common token exclusion broken');
    }

    console.log('\n📊 Summary:');
    console.log('- MKLP tokens will be excluded from GenericTokenAdapter');
    console.log('- Only MerkleTradeAdapter should process MKLP positions');
    console.log('- This should prevent position duplication');

  } catch (error) {
    console.error('❌ Error testing adapters:', error);
  }
}

if (require.main === module) {
  testBothAdapters();
}