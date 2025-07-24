import {
  createDeFiProvider,
  FULLY_INTEGRATED_PROTOCOLS,
} from '../lib/services/defi/createDeFiProvider';

const TEST_WALLET =
  '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

async function testAllAdapters() {
  console.log('🔍 Testing all DeFi adapters on wallet:', TEST_WALLET);
  console.log('='.repeat(80));

  try {
    // Create provider with all adapters
    const provider = await createDeFiProvider({
      apiKey: process.env.APTOS_BUILD_SECRET,
    });

    // Test each adapter individually
    for (const protocol of FULLY_INTEGRATED_PROTOCOLS) {
      console.log(`\n📋 Testing ${protocol.name} (${protocol.adapterId})`);
      console.log(`   Type: ${protocol.type}`);
      console.log(`   Features: ${protocol.features.join(', ')}`);

      try {
        const startTime = Date.now();

        // Scan with only this adapter
        const result = await provider.scanPositions(TEST_WALLET, {
          adapters: [protocol.adapterId],
          parallel: false,
        });

        const duration = Date.now() - startTime;

        if (result.positions.length > 0) {
          console.log(
            `   ✅ Found ${result.positions.length} positions in ${duration}ms`
          );

          // Show position details
          for (const position of result.positions) {
            console.log(
              `      - ${position.positionType}: $${position.totalValueUSD.toFixed(2)}`
            );

            for (const asset of position.assets) {
              console.log(
                `        • ${asset.symbol}: ${asset.amount} (${asset.type})`
              );

              // Show metadata if interesting
              if (asset.metadata && Object.keys(asset.metadata).length > 0) {
                const relevantMetadata = Object.entries(asset.metadata)
                  .filter(([k, v]) => v !== undefined && k !== 'underlying')
                  .slice(0, 3);

                if (relevantMetadata.length > 0) {
                  console.log(
                    `          Metadata:`,
                    Object.fromEntries(relevantMetadata)
                  );
                }
              }
            }
          }
        } else {
          console.log(`   ⚪ No positions found (${duration}ms)`);
        }
      } catch (error) {
        console.log(
          `   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Running full scan with all adapters...\n');

    // Run full scan with all adapters
    const fullResult = await provider.scanPositions(TEST_WALLET, {
      parallel: true,
      minValueUSD: 0.01,
    });

    console.log('Summary:');
    console.log(`- Total positions: ${fullResult.positions.length}`);
    console.log(
      `- Total value: $${fullResult.summary.totalValueUSD.toFixed(2)}`
    );
    console.log(
      `- Protocols found: ${Object.keys(fullResult.summary.protocolBreakdown).join(', ')}`
    );

    console.log('\nProtocol breakdown:');
    for (const [protocol, value] of Object.entries(
      fullResult.summary.protocolBreakdown
    )) {
      console.log(`  - ${protocol}: $${value.toFixed(2)}`);
    }

    console.log('\nPosition type breakdown:');
    for (const [type, count] of Object.entries(
      fullResult.summary.positionTypeBreakdown
    )) {
      console.log(`  - ${type}: ${count} positions`);
    }

    // Show any errors or warnings
    const failedAdapters = FULLY_INTEGRATED_PROTOCOLS.filter(
      p => !fullResult.metadata.adaptersUsed.includes(p.adapterId)
    );

    if (failedAdapters.length > 0) {
      console.log('\n⚠️  Adapters that failed or found no positions:');
      failedAdapters.forEach(p => console.log(`  - ${p.name}`));
    }
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Accuracy checks to consider
console.log('\n🎯 Accuracy Considerations:\n');
console.log(
  '1. Resource Patterns: Each adapter looks for specific patterns like ::lending::, ::pool::'
);
console.log('   These are educated guesses - actual resource types may differ');
console.log('');
console.log(
  '2. Data Structures: Adapters assume certain field names (amount, balance, etc.)'
);
console.log('   Actual on-chain data structures may be different');
console.log('');
console.log('3. Token Decimals: Assuming 8 for APT, 6 for USDC/USDT');
console.log('   Protocols might use different internal representations');
console.log('');
console.log('4. LP Token Valuation: Using simplified estimates');
console.log('   Production code should fetch actual pool reserves');
console.log('');
console.log('5. Protocol Addresses: Using registry addresses');
console.log('   Some protocols might use different addresses for positions');

testAllAdapters().catch(console.error);
