import { graphQLRequest } from '../lib/utils/fetch-utils';
import { getEnvVar } from '../lib/config/validate-env';

const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const CASH_TOKEN_ADDRESS = '0x61ed8b048636516b4eaf4c74250fa4f9440d9c3e163d96aeb863fe658a4bdc67::CASH::CASH';

// Query to get unique holders count and distribution
const CASH_HOLDERS_QUERY = `
  query GetCashHolders($asset_type: String!) {
    holders_count: current_fungible_asset_balances_aggregate(
      where: { 
        asset_type: { _eq: $asset_type },
        amount: { _gt: "0" }
      }
    ) {
      aggregate {
        count
      }
    }
    
    top_holders: current_fungible_asset_balances(
      where: { 
        asset_type: { _eq: $asset_type },
        amount: { _gt: "0" }
      }
      order_by: { amount: desc }
      limit: 10
    ) {
      owner_address
      amount
    }
    
    total_supply: current_fungible_asset_balances_aggregate(
      where: { 
        asset_type: { _eq: $asset_type }
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
    
    metadata: fungible_asset_metadata(
      where: { asset_type: { _eq: $asset_type } }
    ) {
      name
      symbol
      decimals
      asset_type
    }
  }
`;

// Query to get distribution statistics (buckets)
const DISTRIBUTION_QUERY = `
  query GetDistribution($asset_type: String!) {
    small_holders: current_fungible_asset_balances_aggregate(
      where: { 
        asset_type: { _eq: $asset_type },
        amount: { _gt: "0", _lt: "1000000000" }
      }
    ) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    
    medium_holders: current_fungible_asset_balances_aggregate(
      where: { 
        asset_type: { _eq: $asset_type },
        amount: { _gte: "1000000000", _lt: "10000000000" }
      }
    ) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    
    large_holders: current_fungible_asset_balances_aggregate(
      where: { 
        asset_type: { _eq: $asset_type },
        amount: { _gte: "10000000000", _lt: "100000000000" }
      }
    ) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    
    whale_holders: current_fungible_asset_balances_aggregate(
      where: { 
        asset_type: { _eq: $asset_type },
        amount: { _gte: "100000000000" }
      }
    ) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
  }
`;

async function queryCashHolders() {
  try {
    console.log('Querying CASH token holders...\n');
    console.log('Token address:', CASH_TOKEN_ADDRESS);
    console.log('-----------------------------------\n');

    // First query - basic holder info
    console.log('Sending GraphQL query...');
    const response = await graphQLRequest<any>(
      INDEXER_URL,
      {
        query: CASH_HOLDERS_QUERY,
        variables: { asset_type: CASH_TOKEN_ADDRESS },
      },
      {
        headers: {
          'X-Aptos-Client': 'OnAptos-CASH-Analysis',
        },
        timeout: 30000,
        retries: 2,
      }
    ).catch(async (error) => {
      console.error('Raw error:', error);
      
      // Try to make a simpler query to debug
      console.log('\nTrying a simpler query...');
      const simpleQuery = `
        query {
          current_fungible_asset_balances_aggregate(
            where: { 
              asset_type: { _eq: "${CASH_TOKEN_ADDRESS}" }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `;
      
      try {
        const res = await fetch(INDEXER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: simpleQuery }),
        });
        
        const data = await res.text();
        console.log('Response status:', res.status);
        console.log('Response data:', data);
      } catch (e) {
        console.error('Simple query error:', e);
      }
      
      throw error;
    });

    // Parse results
    const holdersCount = response.holders_count?.aggregate?.count || 0;
    const totalSupply = response.total_supply?.aggregate?.sum?.amount || '0';
    const metadata = response.metadata?.[0];
    const topHolders = response.top_holders || [];

    console.log('TOKEN METADATA:');
    if (metadata) {
      console.log(`- Name: ${metadata.name}`);
      console.log(`- Symbol: ${metadata.symbol}`);
      console.log(`- Decimals: ${metadata.decimals}`);
      console.log(`- Asset Type: ${metadata.asset_type}`);
    }
    console.log('\n-----------------------------------\n');

    console.log('HOLDER STATISTICS:');
    console.log(`- Total Unique Holders: ${holdersCount.toLocaleString()}`);
    console.log(`- Total Supply: ${formatAmount(totalSupply, metadata?.decimals || 6)}`);
    console.log('\n-----------------------------------\n');

    // Get distribution data
    console.log('Fetching distribution data...');
    const distributionResponse = await graphQLRequest<any>(
      INDEXER_URL,
      {
        query: DISTRIBUTION_QUERY,
        variables: { asset_type: CASH_TOKEN_ADDRESS },
      },
      {
        headers: {
          'X-Aptos-Client': 'OnAptos-CASH-Analysis',
        },
        timeout: 30000,
        retries: 2,
      }
    );

    console.log('\nDISTRIBUTION ANALYSIS:');
    console.log('(Assuming 6 decimals for CASH token)\n');
    
    const decimals = metadata?.decimals || 6;
    
    // Small holders
    const smallCount = distributionResponse.small_holders?.aggregate?.count || 0;
    const smallAmount = distributionResponse.small_holders?.aggregate?.sum?.amount || '0';
    console.log(`Small holders (< 1,000 CASH):`);
    console.log(`  - Count: ${smallCount.toLocaleString()} (${((smallCount / holdersCount) * 100).toFixed(2)}%)`);
    console.log(`  - Total held: ${formatAmount(smallAmount, decimals)}`);
    console.log(`  - % of supply: ${((BigInt(smallAmount) * 100n) / BigInt(totalSupply)).toString()}%\n`);

    // Medium holders
    const mediumCount = distributionResponse.medium_holders?.aggregate?.count || 0;
    const mediumAmount = distributionResponse.medium_holders?.aggregate?.sum?.amount || '0';
    console.log(`Medium holders (1,000 - 10,000 CASH):`);
    console.log(`  - Count: ${mediumCount.toLocaleString()} (${((mediumCount / holdersCount) * 100).toFixed(2)}%)`);
    console.log(`  - Total held: ${formatAmount(mediumAmount, decimals)}`);
    console.log(`  - % of supply: ${((BigInt(mediumAmount) * 100n) / BigInt(totalSupply)).toString()}%\n`);

    // Large holders
    const largeCount = distributionResponse.large_holders?.aggregate?.count || 0;
    const largeAmount = distributionResponse.large_holders?.aggregate?.sum?.amount || '0';
    console.log(`Large holders (10,000 - 100,000 CASH):`);
    console.log(`  - Count: ${largeCount.toLocaleString()} (${((largeCount / holdersCount) * 100).toFixed(2)}%)`);
    console.log(`  - Total held: ${formatAmount(largeAmount, decimals)}`);
    console.log(`  - % of supply: ${((BigInt(largeAmount) * 100n) / BigInt(totalSupply)).toString()}%\n`);

    // Whale holders
    const whaleCount = distributionResponse.whale_holders?.aggregate?.count || 0;
    const whaleAmount = distributionResponse.whale_holders?.aggregate?.sum?.amount || '0';
    console.log(`Whale holders (>= 100,000 CASH):`);
    console.log(`  - Count: ${whaleCount.toLocaleString()} (${((whaleCount / holdersCount) * 100).toFixed(2)}%)`);
    console.log(`  - Total held: ${formatAmount(whaleAmount, decimals)}`);
    console.log(`  - % of supply: ${((BigInt(whaleAmount) * 100n) / BigInt(totalSupply)).toString()}%\n`);

    console.log('-----------------------------------\n');
    console.log('TOP 10 HOLDERS:');
    topHolders.forEach((holder: any, index: number) => {
      const amount = formatAmount(holder.amount, decimals);
      const percentage = ((BigInt(holder.amount) * 10000n) / BigInt(totalSupply));
      const percentageStr = (Number(percentage) / 100).toFixed(2);
      console.log(`${index + 1}. ${holder.owner_address.slice(0, 6)}...${holder.owner_address.slice(-4)}`);
      console.log(`   Amount: ${amount} (${percentageStr}% of supply)`);
    });

    console.log('\n-----------------------------------');
    console.log(`\nTOTAL UNIQUE CASH TOKEN HOLDERS: ${holdersCount.toLocaleString()}`);
    console.log('-----------------------------------\n');

  } catch (error) {
    console.error('Error querying CASH holders:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

function formatAmount(amount: string, decimals: number): string {
  try {
    const bigAmount = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = bigAmount / divisor;
    const fractionalPart = bigAmount % divisor;
    
    // Format with commas
    const wholeStr = wholePart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Add fractional part if needed
    if (fractionalPart > 0n) {
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      // Remove trailing zeros
      const trimmed = fractionalStr.replace(/0+$/, '');
      if (trimmed.length > 0) {
        return `${wholeStr}.${trimmed}`;
      }
    }
    
    return wholeStr;
  } catch (error) {
    return amount;
  }
}

// Run the query
queryCashHolders();