#!/usr/bin/env tsx

/**
 * Script to discover protocol data using Aptos Indexer API
 */

export {}; // Make this a module

const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const TEST_WALLET =
  '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

interface ProtocolDiscovery {
  protocolName: string;
  contractAddresses: Set<string>;
  entryFunctions: Set<string>;
  assetTypes: Set<string>;
  storagePatterns: Set<string>;
}

const protocols: Record<string, ProtocolDiscovery> = {
  thala: {
    protocolName: 'Thala',
    contractAddresses: new Set(),
    entryFunctions: new Set(),
    assetTypes: new Set(),
    storagePatterns: new Set(),
  },
  liquidswap: {
    protocolName: 'LiquidSwap',
    contractAddresses: new Set(),
    entryFunctions: new Set(),
    assetTypes: new Set(),
    storagePatterns: new Set(),
  },
  pancakeswap: {
    protocolName: 'PancakeSwap',
    contractAddresses: new Set(),
    entryFunctions: new Set(),
    assetTypes: new Set(),
    storagePatterns: new Set(),
  },
  aries: {
    protocolName: 'Aries',
    contractAddresses: new Set(),
    entryFunctions: new Set(),
    assetTypes: new Set(),
    storagePatterns: new Set(),
  },
  merkle: {
    protocolName: 'Merkle',
    contractAddresses: new Set(),
    entryFunctions: new Set(),
    assetTypes: new Set(),
    storagePatterns: new Set(),
  },
};

async function queryIndexer(query: string, variables?: any) {
  const response = await fetch(INDEXER_URL, {
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

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

async function discoverFungibleAssets(walletAddress: string) {
  console.log('🔍 Discovering fungible asset balances...');

  const query = `
    query GetFungibleAssets($wallet: String!) {
      current_fungible_asset_balances(
        where: {owner_address: {_eq: $wallet}, amount: {_gt: "0"}}
      ) {
        asset_type
        amount
        storage_id
        token_standard
        metadata {
          name
          symbol
          decimals
          creator_address
        }
      }
    }
  `;

  const data = await queryIndexer(query, { wallet: walletAddress });

  console.log(
    `Found ${data.current_fungible_asset_balances.length} fungible assets:`
  );

  for (const balance of data.current_fungible_asset_balances) {
    console.log(`\n📄 Asset: ${balance.metadata?.symbol || 'Unknown'}`);
    console.log(`   Type: ${balance.asset_type}`);
    console.log(`   Amount: ${balance.amount}`);
    console.log(`   Creator: ${balance.metadata?.creator_address || 'N/A'}`);
    console.log(`   Storage ID: ${balance.storage_id}`);

    // Categorize by protocol
    categorizeAsset(balance);
  }
}

async function discoverActivities(walletAddress: string) {
  console.log('\n🔍 Discovering fungible asset activities...');

  const query = `
    query GetActivities($wallet: String!) {
      fungible_asset_activities(
        where: {owner_address: {_eq: $wallet}}
        order_by: {transaction_timestamp: desc}
        limit: 100
      ) {
        asset_type
        type
        entry_function_id_str
        amount
        transaction_timestamp
        storage_id
        block_height
      }
    }
  `;

  const data = await queryIndexer(query, { wallet: walletAddress });

  console.log(`Found ${data.fungible_asset_activities.length} activities:`);

  const entryFunctions = new Set<string>();

  for (const activity of data.fungible_asset_activities) {
    if (activity.entry_function_id_str) {
      entryFunctions.add(activity.entry_function_id_str);
    }

    // Categorize by protocol
    categorizeActivity(activity);
  }

  console.log('\n📋 Unique entry functions found:');
  Array.from(entryFunctions)
    .sort()
    .forEach(func => {
      console.log(`   ${func}`);
    });
}

async function discoverUserTransactions(walletAddress: string) {
  console.log('\n🔍 Discovering user transactions...');

  const query = `
    query GetUserTransactions($wallet: String!) {
      user_transactions(
        where: {sender: {_eq: $wallet}}
        order_by: {version: desc}
        limit: 50
      ) {
        version
        entry_function_id_str
        sender
      }
    }
  `;

  const data = await queryIndexer(query, { wallet: walletAddress });

  console.log(`Found ${data.user_transactions.length} user transactions`);

  const protocolInteractions = new Map<string, number>();

  for (const tx of data.user_transactions) {
    if (tx.entry_function_id_str) {
      const address = tx.entry_function_id_str.split('::')[0];
      protocolInteractions.set(
        address,
        (protocolInteractions.get(address) || 0) + 1
      );

      // Categorize by protocol
      categorizeTransaction(tx);
    }
  }

  console.log('\n📊 Protocol interaction counts:');
  Array.from(protocolInteractions.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([address, count]) => {
      console.log(`   ${address}: ${count} transactions`);
    });
}

function categorizeAsset(balance: any) {
  const assetType = balance.asset_type.toLowerCase();
  const creatorAddress = balance.metadata?.creator_address?.toLowerCase() || '';
  const symbol = balance.metadata?.symbol?.toLowerCase() || '';

  if (
    symbol.includes('thl') ||
    creatorAddress.includes('thala') ||
    assetType.includes('thala')
  ) {
    protocols.thala.assetTypes.add(balance.asset_type);
    protocols.thala.storagePatterns.add(balance.storage_id);
    if (creatorAddress) protocols.thala.contractAddresses.add(creatorAddress);
  }

  if (
    symbol.includes('liquid') ||
    assetType.includes('liquid') ||
    assetType.includes('hippo')
  ) {
    protocols.liquidswap.assetTypes.add(balance.asset_type);
    protocols.liquidswap.storagePatterns.add(balance.storage_id);
    if (creatorAddress)
      protocols.liquidswap.contractAddresses.add(creatorAddress);
  }

  if (symbol.includes('cake') || assetType.includes('pancake')) {
    protocols.pancakeswap.assetTypes.add(balance.asset_type);
    protocols.pancakeswap.storagePatterns.add(balance.storage_id);
    if (creatorAddress)
      protocols.pancakeswap.contractAddresses.add(creatorAddress);
  }

  if (symbol.includes('aries') || assetType.includes('aries')) {
    protocols.aries.assetTypes.add(balance.asset_type);
    protocols.aries.storagePatterns.add(balance.storage_id);
    if (creatorAddress) protocols.aries.contractAddresses.add(creatorAddress);
  }

  if (
    symbol.includes('mklp') ||
    symbol.includes('merkle') ||
    assetType.includes('merkle')
  ) {
    protocols.merkle.assetTypes.add(balance.asset_type);
    protocols.merkle.storagePatterns.add(balance.storage_id);
    if (creatorAddress) protocols.merkle.contractAddresses.add(creatorAddress);
  }
}

function categorizeActivity(activity: any) {
  const entryFunc = activity.entry_function_id_str?.toLowerCase() || '';
  const assetType = activity.asset_type.toLowerCase();

  Object.values(protocols).forEach(protocol => {
    const protocolName = protocol.protocolName.toLowerCase();

    if (entryFunc.includes(protocolName) || assetType.includes(protocolName)) {
      if (activity.entry_function_id_str) {
        protocol.entryFunctions.add(activity.entry_function_id_str);
        const address = activity.entry_function_id_str.split('::')[0];
        protocol.contractAddresses.add(address);
      }
      protocol.assetTypes.add(activity.asset_type);
      if (activity.storage_id)
        protocol.storagePatterns.add(activity.storage_id);
    }
  });
}

function categorizeTransaction(tx: any) {
  const entryFunc = tx.entry_function_id_str?.toLowerCase() || '';

  Object.values(protocols).forEach(protocol => {
    const protocolName = protocol.protocolName.toLowerCase();

    if (entryFunc.includes(protocolName)) {
      protocol.entryFunctions.add(tx.entry_function_id_str);
      const address = tx.entry_function_id_str.split('::')[0];
      protocol.contractAddresses.add(address);
    }
  });
}

function generateProtocolReport() {
  console.log('\n\n🏛️ PROTOCOL DISCOVERY REPORT');
  console.log('=====================================');

  Object.values(protocols).forEach(protocol => {
    if (
      protocol.contractAddresses.size === 0 &&
      protocol.entryFunctions.size === 0 &&
      protocol.assetTypes.size === 0
    ) {
      return; // Skip protocols with no data
    }

    console.log(`\n### ${protocol.protocolName.toUpperCase()}`);

    if (protocol.contractAddresses.size > 0) {
      console.log('📍 Contract Addresses:');
      Array.from(protocol.contractAddresses).forEach(addr => {
        console.log(`   ${addr}`);
      });
    }

    if (protocol.entryFunctions.size > 0) {
      console.log('🔧 Entry Functions:');
      Array.from(protocol.entryFunctions).forEach(func => {
        console.log(`   ${func}`);
      });
    }

    if (protocol.assetTypes.size > 0) {
      console.log('🪙 Asset Types:');
      Array.from(protocol.assetTypes).forEach(asset => {
        console.log(`   ${asset}`);
      });
    }

    if (protocol.storagePatterns.size > 0) {
      console.log('💾 Storage Patterns:');
      Array.from(protocol.storagePatterns)
        .slice(0, 3)
        .forEach(storage => {
          console.log(`   ${storage}`);
        });
      if (protocol.storagePatterns.size > 3) {
        console.log(`   ... and ${protocol.storagePatterns.size - 3} more`);
      }
    }
  });
}

async function generateResourceQueries() {
  console.log('\n\n🔍 RESOURCE DISCOVERY QUERIES');
  console.log('===============================');

  Object.values(protocols).forEach(protocol => {
    if (protocol.contractAddresses.size === 0) return;

    console.log(`\n// ${protocol.protocolName} Resource Discovery`);
    Array.from(protocol.contractAddresses).forEach(address => {
      console.log(`// Query resources for ${address}`);
      console.log(`query {`);
      console.log(`  account_transactions(`);
      console.log(`    where: {account_address: {_eq: "${TEST_WALLET}"}}`);
      console.log(`  ) {`);
      console.log(`    transaction_version`);
      console.log(`  }`);
      console.log(`}`);
      console.log('');
    });
  });
}

async function main() {
  try {
    console.log(`🚀 Starting protocol discovery for wallet: ${TEST_WALLET}`);

    await discoverFungibleAssets(TEST_WALLET);
    await discoverActivities(TEST_WALLET);
    await discoverUserTransactions(TEST_WALLET);

    generateProtocolReport();
    await generateResourceQueries();

    console.log('\n✅ Protocol discovery completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Use the contract addresses to query actual resources');
    console.log(
      '   2. Analyze the entry functions to understand protocol interactions'
    );
    console.log('   3. Update adapter resource patterns with discovered data');
  } catch (error) {
    console.error('❌ Error during discovery:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
