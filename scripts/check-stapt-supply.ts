import { executeGraphQLQuery } from '@/lib/services/assets/utils/graphql-helpers';

const STAPT_COIN_ADDRESS =
  '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt';
const STAPT_FA_ADDRESS =
  '0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627';

async function checkStAPTSupply() {
  try {
    // Try with coin address first (this is what LST service uses)
    console.log('\n=== Checking Amnis stAPT Supply ===');
    console.log(`Coin Address: ${STAPT_COIN_ADDRESS}`);
    console.log(`FA Address: ${STAPT_FA_ADDRESS}`);

    const query = `
      query GetStAPTSupply($assetType: String!) {
        current_fungible_asset_balances_aggregate(
          where: { 
            asset_type: { _eq: $assetType },
            amount: { _gt: "0" }
          }
        ) {
          aggregate {
            sum {
              amount
            }
            count
          }
        }
      }
    `;

    // Try with coin address
    console.log('\nTrying with coin address...');
    const response = await executeGraphQLQuery<{
      current_fungible_asset_balances_aggregate: {
        aggregate: {
          sum: {
            amount: string | null;
          };
          count: number;
        };
      };
    }>(query, { assetType: STAPT_COIN_ADDRESS });

    const totalSupply =
      response?.current_fungible_asset_balances_aggregate?.aggregate?.sum
        ?.amount || '0';
    const holderCount =
      response?.current_fungible_asset_balances_aggregate?.aggregate?.count ||
      0;

    console.log(`\nTotal Supply (raw): ${totalSupply}`);
    if (totalSupply !== '0') {
      console.log(
        `Total Supply (formatted): ${(BigInt(totalSupply) / BigInt(10 ** 8)).toString()} stAPT`
      );
      console.log(`Number of Holders: ${holderCount}`);
    }

    // Also try with FA address
    console.log('\nTrying with FA address...');
    const faResponse = await executeGraphQLQuery<{
      current_fungible_asset_balances_aggregate: {
        aggregate: {
          sum: {
            amount: string | null;
          };
          count: number;
        };
      };
    }>(query, { assetType: STAPT_FA_ADDRESS });

    const faTotalSupply =
      faResponse?.current_fungible_asset_balances_aggregate?.aggregate?.sum
        ?.amount || '0';
    const faHolderCount =
      faResponse?.current_fungible_asset_balances_aggregate?.aggregate?.count ||
      0;

    console.log(`\nFA Total Supply (raw): ${faTotalSupply}`);
    if (faTotalSupply !== '0') {
      console.log(
        `FA Total Supply (formatted): ${(BigInt(faTotalSupply) / BigInt(10 ** 8)).toString()} stAPT`
      );
      console.log(`FA Number of Holders: ${faHolderCount}`);
    }

    console.log('===============================\n');
  } catch (error) {
    console.error('Error fetching stAPT supply:', error);
  }
}

// Run the check
checkStAPTSupply();
