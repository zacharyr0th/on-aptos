const INDEXER_API_URL = 'https://api.mainnet.aptoslabs.com/v1/graphql';
const TARGET_ADDRESS =
  '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

// Query for fungible asset balances (tokens)
const TOKENS_QUERY = `
  query GetTokens($owner_address: String!) {
    current_fungible_asset_balances(
      where: {owner_address: {_eq: $owner_address}}
    ) {
      amount
      asset_type
      is_frozen
      is_primary
      last_transaction_timestamp
      last_transaction_version
      metadata {
        name
        symbol
        decimals
        icon_uri
        project_uri
        creator_address
      }
      token_standard
    }
  }
`;

// Query for NFT ownerships with pagination
const NFTS_QUERY = `
  query GetNFTs($owner_address: String!, $limit: Int!, $offset: Int!) {
    current_token_ownerships_v2(
      where: {owner_address: {_eq: $owner_address}}
      limit: $limit
      offset: $offset
      order_by: {last_transaction_timestamp: desc}
    ) {
      amount
      token_data_id
      property_version_v1
      last_transaction_timestamp
      last_transaction_version
      is_soulbound_v2
      token_standard
      current_token_data {
        token_name
        description
        token_uri
        collection_id
        decimals
        supply
        maximum
        current_collection {
          collection_name
          description
          uri
          creator_address
          current_supply
          max_supply
        }
      }
    }
  }
`;

// Query to get total count of NFTs
const NFTS_COUNT_QUERY = `
  query GetNFTsCount($owner_address: String!) {
    current_token_ownerships_v2_aggregate(
      where: {owner_address: {_eq: $owner_address}}
    ) {
      aggregate {
        count
      }
    }
  }
`;

async function queryGraphQL(query: string, variables: any) {
  const response = await fetch(INDEXER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function getAllNFTs(ownerAddress: string) {
  // First get the total count
  const countResult = await queryGraphQL(NFTS_COUNT_QUERY, {
    owner_address: ownerAddress,
  });

  const totalCount =
    countResult.data.current_token_ownerships_v2_aggregate.aggregate.count;
  console.log(`Total NFTs to fetch: ${totalCount}`);

  const allNFTs = [];
  const limit = 100; // Fetch in batches of 100

  for (let offset = 0; offset < totalCount; offset += limit) {
    console.log(
      `Fetching NFTs ${offset + 1} to ${Math.min(offset + limit, totalCount)}...`
    );

    const nftsResult = await queryGraphQL(NFTS_QUERY, {
      owner_address: ownerAddress,
      limit: limit,
      offset: offset,
    });

    if (nftsResult.errors) {
      console.error('NFTs query errors:', nftsResult.errors);
      break;
    }

    allNFTs.push(...nftsResult.data.current_token_ownerships_v2);
  }

  return allNFTs;
}

async function main() {
  try {
    const outputLines: string[] = [];
    const log = (message: string) => {
      console.log(message);
      outputLines.push(message);
    };

    log(`\n=== Querying assets for address: ${TARGET_ADDRESS} ===\n`);

    // Query tokens
    log('🪙 Querying fungible asset balances (tokens)...\n');
    const tokensResult = await queryGraphQL(TOKENS_QUERY, {
      owner_address: TARGET_ADDRESS,
    });

    if (tokensResult.errors) {
      console.error('Tokens query errors:', tokensResult.errors);
    } else {
      const tokens = tokensResult.data.current_fungible_asset_balances;
      log(`Found ${tokens.length} token balances:\n`);

      tokens.forEach((token: any, index: number) => {
        log(
          `${index + 1}. ${token.metadata?.name || 'Unknown Token'} (${token.metadata?.symbol || 'N/A'})`
        );
        log(`   Asset Type: ${token.asset_type}`);
        log(`   Amount: ${token.amount}`);
        log(`   Decimals: ${token.metadata?.decimals || 'N/A'}`);
        log(`   Standard: ${token.token_standard}`);
        log(`   Creator: ${token.metadata?.creator_address || 'N/A'}`);
        log(`   Last Transaction: ${token.last_transaction_timestamp}`);
        if (token.metadata?.icon_uri) {
          log(`   Icon: ${token.metadata.icon_uri}`);
        }
        if (token.metadata?.project_uri) {
          log(`   Project: ${token.metadata.project_uri}`);
        }
        log('');
      });
    }

    // Query NFTs with pagination
    log('\n🖼️  Querying NFT ownerships...\n');
    const allNFTs = await getAllNFTs(TARGET_ADDRESS);

    log(`Found ${allNFTs.length} NFT ownerships:\n`);

    allNFTs.forEach((nft: any, index: number) => {
      const tokenData = nft.current_token_data;
      const collection = tokenData?.current_collection;

      log(`${index + 1}. ${tokenData?.token_name || 'Unknown NFT'}`);
      log(`   Token ID: ${nft.token_data_id}`);
      log(
        `   Collection: ${collection?.collection_name || 'Unknown Collection'}`
      );
      log(`   Amount Owned: ${nft.amount}`);
      log(`   Standard: ${nft.token_standard}`);
      log(`   Property Version: ${nft.property_version_v1}`);
      log(`   Creator: ${collection?.creator_address || 'N/A'}`);
      log(`   Last Transaction: ${nft.last_transaction_timestamp}`);

      if (tokenData?.description) {
        log(`   Description: ${tokenData.description}`);
      }
      if (tokenData?.token_uri) {
        log(`   Token URI: ${tokenData.token_uri}`);
      }
      if (collection?.uri) {
        log(`   Collection URI: ${collection.uri}`);
      }
      if (nft.is_soulbound_v2) {
        log(`   Soulbound: ${nft.is_soulbound_v2}`);
      }

      log('');
    });

    // Summary
    const tokenCount =
      tokensResult.data?.current_fungible_asset_balances?.length || 0;
    const nftCount = allNFTs.length;

    log('\n=== SUMMARY ===');
    log(`Address: ${TARGET_ADDRESS}`);
    log(`Total Tokens: ${tokenCount}`);
    log(`Total NFTs: ${nftCount}`);
    log(`Total Assets: ${tokenCount + nftCount}`);

    // Save to file
    const fs = require('fs');
    const outputFile = `/Users/zacharyr0th/Documents/Projects/on-aptos/address-assets-${TARGET_ADDRESS.slice(2, 8)}.txt`;
    fs.writeFileSync(outputFile, outputLines.join('\n'));
    log(`\nOutput saved to: ${outputFile}`);
  } catch (error) {
    console.error('Error querying assets:', error);
  }
}

if (require.main === module) {
  main();
}

export {
  main,
  queryGraphQL,
  TOKENS_QUERY,
  NFTS_QUERY,
  NFTS_COUNT_QUERY,
  getAllNFTs,
};
