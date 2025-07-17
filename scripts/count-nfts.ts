import { graphQLRequest } from '../lib/utils/fetch-utils';
import { logger } from '../lib/utils/logger';
import { getEnvVar } from '../lib/config/validate-env';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const APTOS_API_KEY = getEnvVar('APTOS_BUILD_SECRET');

// Query to count NFTs for a wallet
const COUNT_NFTS_QUERY = `
  query CountWalletNFTs($ownerAddress: String!) {
    current_token_ownerships_v2_aggregate(
      where: { 
        owner_address: { _eq: $ownerAddress },
        amount: { _eq: 1 }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Query to get NFT details with pagination
const GET_NFTS_QUERY = `
  query GetWalletNFTs($ownerAddress: String!, $limit: Int!, $offset: Int!) {
    current_token_ownerships_v2(
      where: { 
        owner_address: { _eq: $ownerAddress },
        amount: { _eq: 1 }
      }
      limit: $limit
      offset: $offset
      order_by: { last_transaction_timestamp: desc }
    ) {
      current_token_data {
        token_data_id
        token_name
        description
        token_uri
        current_collection {
          collection_name
          description
          creator_address
        }
      }
      amount
      last_transaction_timestamp
    }
  }
`;

async function countNFTs(walletAddress: string): Promise<number> {
  try {
    logger.info(`Counting NFTs for wallet: ${walletAddress}`);

    const response = await graphQLRequest<{
      current_token_ownerships_v2_aggregate: {
        aggregate: {
          count: number;
        };
      };
    }>(
      INDEXER,
      {
        query: COUNT_NFTS_QUERY,
        variables: { ownerAddress: walletAddress },
      },
      APTOS_API_KEY
        ? {
            headers: {
              Authorization: `Bearer ${APTOS_API_KEY}`,
            },
          }
        : {}
    );

    const count = response.current_token_ownerships_v2_aggregate.aggregate.count;
    logger.info(`Total NFT count: ${count}`);
    return count;
  } catch (error) {
    logger.error('Failed to count NFTs:', error);
    throw error;
  }
}

async function getNFTDetails(walletAddress: string, limit: number = 10) {
  try {
    logger.info(`Fetching first ${limit} NFTs for wallet: ${walletAddress}`);

    const response = await graphQLRequest<{
      current_token_ownerships_v2: Array<{
        current_token_data: {
          token_data_id: string;
          token_name: string;
          description?: string;
          token_uri: string;
          current_collection?: {
            collection_name: string;
            description?: string;
            creator_address: string;
          };
        };
        amount: number;
        last_transaction_timestamp?: string;
      }>;
    }>(
      INDEXER,
      {
        query: GET_NFTS_QUERY,
        variables: { 
          ownerAddress: walletAddress, 
          limit: limit,
          offset: 0 
        },
      },
      APTOS_API_KEY
        ? {
            headers: {
              Authorization: `Bearer ${APTOS_API_KEY}`,
            },
          }
        : {}
    );

    const nfts = response.current_token_ownerships_v2;
    
    logger.info(`\nFirst ${Math.min(limit, nfts.length)} NFTs:`);
    nfts.forEach((nft, index) => {
      console.log(`\n${index + 1}. ${nft.current_token_data.token_name}`);
      console.log(`   Collection: ${nft.current_token_data.current_collection?.collection_name || 'Unknown'}`);
      console.log(`   Amount: ${nft.amount}`);
      if (nft.current_token_data.description) {
        console.log(`   Description: ${nft.current_token_data.description.substring(0, 100)}...`);
      }
    });

    return nfts;
  } catch (error) {
    logger.error('Failed to get NFT details:', error);
    throw error;
  }
}

async function main() {
  const walletAddress = '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';
  
  try {
    // First, get the total count
    const totalCount = await countNFTs(walletAddress);
    console.log(`\n===========================================`);
    console.log(`Total NFTs owned by wallet: ${totalCount}`);
    console.log(`===========================================\n`);
    
    // Then, get details of first 10 NFTs as a sample
    if (totalCount > 0) {
      await getNFTDetails(walletAddress, 10);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();