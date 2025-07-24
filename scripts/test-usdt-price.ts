import { PanoraService } from '../lib/services/portfolio/panora-service';

async function testUSDTPrice() {
  const usdtAddress =
    '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b';

  console.log('Testing USDT price from Panora API...');
  console.log('Address:', usdtAddress);

  try {
    const prices = await PanoraService.getTokenPrices([usdtAddress]);
    console.log('\nResult:', JSON.stringify(prices, null, 2));

    if (prices.length > 0 && prices[0].usdPrice !== 'null') {
      console.log(
        '\n✓ USDT price successfully fetched: $' + prices[0].usdPrice
      );
    } else {
      console.log('\n✗ USDT price not found in Panora API');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testUSDTPrice();
