import { PanoraService } from '../lib/services/portfolio/panora-service';
import { aptosAnalytics } from '../lib/services/aptos-analytics';

async function testTokenPriceAPI() {
  console.log('Testing Token Latest Price API...\n');

  const testAddresses = [
    {
      name: 'APT (Coin)',
      address: '0x1::aptos_coin::AptosCoin',
    },
    {
      name: 'APT (FA)',
      address: '0xa',
    },
    {
      name: 'USDC',
      address:
        '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
    },
    {
      name: 'USDT',
      address:
        '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
    },
    {
      name: 'Random Token (should fail gracefully)',
      address: '0x123456789abcdef',
    },
  ];

  for (const test of testAddresses) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Address: ${test.address}`);
    console.log('-'.repeat(60));

    try {
      // Test Panora API
      console.log('1. Panora API:');
      try {
        const panoraPrices = await PanoraService.getTokenPrices([test.address]);
        if (panoraPrices.length > 0) {
          const price = panoraPrices[0];
          console.log(`   ✓ Price: $${price.usdPrice}`);
          console.log(`   ✓ Symbol: ${price.symbol}`);
          console.log(`   ✓ Name: ${price.name}`);
        } else {
          console.log('   ✗ No price data found');
        }
      } catch (error) {
        console.log(
          `   ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Test Aptos Analytics API
      console.log('\n2. Aptos Analytics API:');
      try {
        const aptosData = await aptosAnalytics.getTokenLatestPrice({
          address: test.address,
        });
        if (aptosData && aptosData.length > 0) {
          const price = aptosData[0];
          console.log(`   ✓ Price: $${price.price_usd}`);
          console.log(
            `   ✓ Timestamp: ${price.bucketed_timestamp_minutes_utc}`
          );
        } else {
          console.log('   ✗ No price data found');
        }
      } catch (error) {
        console.log(
          `   ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Test the combined API endpoint (simulated)
      console.log('\n3. Combined API (simulated):');
      let foundPrice = false;

      // Try Panora first
      try {
        const panoraPrices = await PanoraService.getTokenPrices([test.address]);
        if (panoraPrices.length > 0) {
          console.log(`   ✓ Source: Panora`);
          console.log(`   ✓ Price: $${panoraPrices[0].usdPrice}`);
          foundPrice = true;
        }
      } catch (error) {
        // Continue to fallback
      }

      // Fallback to Aptos Analytics
      if (!foundPrice) {
        try {
          const aptosData = await aptosAnalytics.getTokenLatestPrice({
            address: test.address,
          });
          if (aptosData && aptosData.length > 0) {
            console.log(`   ✓ Source: Aptos Analytics (fallback)`);
            console.log(`   ✓ Price: $${aptosData[0].price_usd}`);
            foundPrice = true;
          }
        } catch (error) {
          // Continue
        }
      }

      if (!foundPrice) {
        console.log('   ✗ No price found from any source');
      }
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error);
    }
  }
}

// Run the test
testTokenPriceAPI().catch(console.error);
