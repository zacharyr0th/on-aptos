import { AssetService } from '../lib/services/portfolio/services/asset-service';
import { NFTService } from '../lib/services/portfolio/services/nft-service';

const TEST_ADDRESS =
  '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

async function testServices() {
  console.log('\n=== Testing Portfolio Services ===\n');
  console.log(`Testing address: ${TEST_ADDRESS}`);

  try {
    // Test AssetService
    console.log('\n🪙 Testing AssetService...');
    const assets = await AssetService.getWalletAssets(TEST_ADDRESS);
    console.log(`✅ Assets fetched: ${assets.length}`);

    if (assets.length > 0) {
      console.log('Sample assets:');
      assets.slice(0, 3).forEach((asset, i) => {
        console.log(
          `  ${i + 1}. ${asset.metadata?.name || 'Unknown'} (${asset.metadata?.symbol || 'N/A'})`
        );
        console.log(
          `     Amount: ${asset.amount}, Balance: ${asset.balance}, Value: $${asset.value || 0}`
        );
      });
    }

    // Test NFTService
    console.log('\n🖼️  Testing NFTService...');

    // First get total count
    const totalNFTs = await NFTService.getTotalNFTCount(TEST_ADDRESS);
    console.log(`📊 Total NFT count: ${totalNFTs}`);

    // Get first page of NFTs
    const nftPage = await NFTService.getWalletNFTs(TEST_ADDRESS, 1, 5);
    console.log(
      `✅ NFTs fetched (page 1): ${nftPage.data.length}, hasMore: ${nftPage.hasMore}`
    );

    if (nftPage.data.length > 0) {
      console.log('Sample NFTs:');
      nftPage.data.forEach((nft, i) => {
        console.log(`  ${i + 1}. ${nft.token_name}`);
        console.log(`     Collection: ${nft.collection_name}`);
        console.log(`     Creator: ${nft.creator_address}`);
      });
    }

    // Test getting all NFTs (limited to first 50 for testing)
    console.log('\n📦 Testing getAllWalletNFTs (limited to 50)...');
    const allNFTs = await NFTService.getAllWalletNFTs(TEST_ADDRESS);
    console.log(`✅ All NFTs fetched: ${allNFTs.length}`);

    console.log('\n=== Summary ===');
    console.log(`Total Assets: ${assets.length}`);
    console.log(`Total NFTs: ${allNFTs.length}`);
    console.log(`Services working: ✅`);
  } catch (error) {
    console.error('❌ Error testing services:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'Unknown error'
    );
  }
}

if (require.main === module) {
  testServices();
}
