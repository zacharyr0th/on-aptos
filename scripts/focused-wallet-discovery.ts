#!/usr/bin/env tsx

/**
 * Focused protocol discovery for single wallet
 * Gets accurate data for 0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522
 */

export {}; // Make this a module

const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const REST_API_URL = 'https://fullnode.mainnet.aptoslabs.com/v1';
const TARGET_WALLET =
  '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

interface ProtocolFindings {
  name: string;
  contracts: string[];
  entryFunctions: string[];
  assetTypes: string[];
  resourceTypes: string[];
  userResources: any[];
  positions: any[];
}

const findings: Record<string, ProtocolFindings> = {};

async function queryIndexer(query: string, variables?: any) {
  const response = await fetch(INDEXER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
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

async function queryRestAPI(endpoint: string) {
  const response = await fetch(`${REST_API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`REST API error! status: ${response.status}`);
  }
  return response.json();
}

async function discoverWalletAssets() {
  console.log(`🔍 Discovering assets for wallet: ${TARGET_WALLET}\n`);

  const query = `
    query GetAssets($wallet: String!) {
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
          icon_uri
        }
      }
    }
  `;

  const data = await queryIndexer(query, { wallet: TARGET_WALLET });

  console.log(`Found ${data.current_fungible_asset_balances.length} assets:\n`);

  for (const asset of data.current_fungible_asset_balances) {
    const symbol = asset.metadata?.symbol || 'Unknown';
    const amount = asset.amount;

    console.log(`💰 ${symbol}: ${amount}`);
    console.log(`   Type: ${asset.asset_type}`);
    console.log(`   Creator: ${asset.metadata?.creator_address || 'N/A'}`);
    console.log(`   Storage: ${asset.storage_id}`);
    console.log('');

    // Categorize by protocol
    categorizeAsset(asset);
  }
}

async function discoverWalletActivities() {
  console.log('🔍 Discovering recent activities...\n');

  const query = `
    query GetActivities($wallet: String!) {
      fungible_asset_activities(
        where: {owner_address: {_eq: $wallet}}
        order_by: {transaction_timestamp: desc}
        limit: 50
      ) {
        asset_type
        type
        entry_function_id_str
        amount
        transaction_timestamp
        storage_id
      }
    }
  `;

  const data = await queryIndexer(query, { wallet: TARGET_WALLET });

  const uniqueEntryFunctions = new Set<string>();

  for (const activity of data.fungible_asset_activities) {
    if (activity.entry_function_id_str) {
      uniqueEntryFunctions.add(activity.entry_function_id_str);
      categorizeActivity(activity);
    }
  }

  console.log('📋 Entry functions found:');
  Array.from(uniqueEntryFunctions).forEach(func => {
    console.log(`   ${func}`);
  });
  console.log('');
}

async function discoverWalletResources() {
  console.log('🔍 Discovering wallet resources...\n');

  try {
    const resources = await queryRestAPI(
      `/accounts/${TARGET_WALLET}/resources`
    );

    console.log(`Found ${resources.length} resources in wallet\n`);

    // Look for DeFi-related resources
    const defiResources = resources.filter((resource: any) => {
      const type = resource.type.toLowerCase();
      return (
        type.includes('pool') ||
        type.includes('lp') ||
        type.includes('liquidity') ||
        type.includes('farming') ||
        type.includes('staking') ||
        type.includes('lending') ||
        type.includes('vault') ||
        type.includes('position') ||
        type.includes('coinstore') ||
        type.includes('trading') ||
        type.includes('reward')
      );
    });

    console.log(`📄 Found ${defiResources.length} DeFi-related resources:`);

    for (const resource of defiResources) {
      console.log(`\n⚙️  ${resource.type}`);

      // Show sample data structure
      if (resource.data && Object.keys(resource.data).length > 0) {
        const dataStr = JSON.stringify(resource.data, null, 2);
        console.log(
          `   Data: ${dataStr.substring(0, 200)}${dataStr.length > 200 ? '...' : ''}`
        );
      }

      // Categorize this resource
      categorizeResource(resource);
    }
  } catch (error) {
    console.warn(`⚠️  Could not fetch wallet resources: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function categorizeAsset(asset: any) {
  const assetType = asset.asset_type.toLowerCase();
  const symbol = asset.metadata?.symbol?.toLowerCase() || '';
  const creator = asset.metadata?.creator_address?.toLowerCase() || '';

  // Merkle Trade
  if (
    symbol.includes('mklp') ||
    assetType.includes(
      '5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06'
    )
  ) {
    ensureProtocol('merkle');
    findings.merkle.assetTypes.push(asset.asset_type);
    findings.merkle.contracts.push(
      '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06'
    );
  }

  // Thala
  if (
    symbol.includes('thala') ||
    symbol.includes('thl') ||
    creator.includes(
      '7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5'
    )
  ) {
    ensureProtocol('thala');
    findings.thala.assetTypes.push(asset.asset_type);
    if (creator) findings.thala.contracts.push(creator);
  }

  // Cellana
  if (symbol.includes('cell')) {
    ensureProtocol('cellana');
    findings.cellana.assetTypes.push(asset.asset_type);
    if (creator) findings.cellana.contracts.push(creator);
  }

  // Uptos
  if (
    symbol.includes('upt') &&
    assetType.includes(
      'e1d39a72bd69bc2ebfe008bb925badb23a32883b077218b9e167f74cf703db1a'
    )
  ) {
    ensureProtocol('uptos');
    findings.uptos.assetTypes.push(asset.asset_type);
    findings.uptos.contracts.push(
      '0xe1d39a72bd69bc2ebfe008bb925badb23a32883b077218b9e167f74cf703db1a'
    );
  }
}

function categorizeActivity(activity: any) {
  const entryFunc = activity.entry_function_id_str?.toLowerCase() || '';

  // Merkle Trade
  if (
    entryFunc.includes(
      '5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06'
    )
  ) {
    ensureProtocol('merkle');
    findings.merkle.entryFunctions.push(activity.entry_function_id_str);
  }

  // Panora Exchange
  if (
    entryFunc.includes(
      '1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c'
    )
  ) {
    ensureProtocol('panora');
    findings.panora.entryFunctions.push(activity.entry_function_id_str);
    findings.panora.contracts.push(
      '0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c'
    );
  }

  // Thala
  if (
    entryFunc.includes(
      '7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5'
    )
  ) {
    ensureProtocol('thala');
    findings.thala.entryFunctions.push(activity.entry_function_id_str);
    findings.thala.contracts.push(
      '0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5'
    );
  }
}

function categorizeResource(resource: any) {
  const resourceType = resource.type.toLowerCase();

  // Check which protocol this resource belongs to
  if (
    resourceType.includes(
      '5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06'
    )
  ) {
    ensureProtocol('merkle');
    findings.merkle.resourceTypes.push(resource.type);
    findings.merkle.userResources.push(resource);
  }

  if (
    resourceType.includes(
      '7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5'
    )
  ) {
    ensureProtocol('thala');
    findings.thala.resourceTypes.push(resource.type);
    findings.thala.userResources.push(resource);
  }

  // Look for other protocol patterns
  const contractMatch = resourceType.match(/0x([a-f0-9]{64})/);
  if (contractMatch) {
    const address = `0x${contractMatch[1]}`;

    // Check against known protocol contracts
    const protocolContracts = {
      '0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12':
        'cellana',
      '0xe1d39a72bd69bc2ebfe008bb925badb23a32883b077218b9e167f74cf703db1a':
        'uptos',
      '0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114':
        'tortuga',
    };

    for (const [contractAddr, protocolName] of Object.entries(
      protocolContracts
    )) {
      if (address === contractAddr) {
        ensureProtocol(protocolName);
        findings[protocolName].resourceTypes.push(resource.type);
        findings[protocolName].userResources.push(resource);
        findings[protocolName].contracts.push(address);
      }
    }
  }
}

function ensureProtocol(name: string) {
  if (!findings[name]) {
    findings[name] = {
      name,
      contracts: [],
      entryFunctions: [],
      assetTypes: [],
      resourceTypes: [],
      userResources: [],
      positions: [],
    };
  }
}

async function analyzePositions() {
  console.log('\n🎯 Analyzing actual DeFi positions...\n');

  for (const [protocolName, data] of Object.entries(findings)) {
    if (data.userResources.length === 0 && data.assetTypes.length === 0)
      continue;

    console.log(`### ${protocolName.toUpperCase()} POSITIONS`);
    console.log('─'.repeat(40));

    // Analyze LP tokens / balances
    for (const assetType of data.assetTypes) {
      try {
        const query = `
          query CheckBalance($wallet: String!, $assetType: String!) {
            current_fungible_asset_balances(
              where: {owner_address: {_eq: $wallet}, asset_type: {_eq: $assetType}}
            ) {
              amount
              metadata {
                symbol
                decimals
              }
            }
          }
        `;

        const result = await queryIndexer(query, {
          wallet: TARGET_WALLET,
          assetType,
        });

        if (result.current_fungible_asset_balances.length > 0) {
          const balance = result.current_fungible_asset_balances[0];
          const symbol = balance.metadata?.symbol || 'Unknown';
          const amount = balance.amount;
          const decimals = balance.metadata?.decimals || 0;
          const humanAmount = parseFloat(amount) / Math.pow(10, decimals);

          console.log(`💰 ${symbol}: ${humanAmount.toFixed(6)}`);
          console.log(`   Raw amount: ${amount}`);
          console.log(`   Asset type: ${assetType}`);

          data.positions.push({
            type: 'token_balance',
            asset: assetType,
            symbol,
            amount,
            humanAmount,
          });
        }
      } catch (error) {
        console.warn(`   ⚠️  Error checking balance: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Analyze user resources
    for (const resource of data.userResources) {
      console.log(`⚙️  Resource: ${resource.type}`);

      if (resource.data) {
        // Look for position-like data
        const resourceData = resource.data;
        console.log(`   Data keys: ${Object.keys(resourceData).join(', ')}`);

        // Look for amounts, balances, positions
        for (const [key, value] of Object.entries(resourceData)) {
          if (typeof value === 'string' && value.match(/^\d+$/)) {
            console.log(`   ${key}: ${value}`);
          } else if (typeof value === 'object' && value !== null) {
            console.log(
              `   ${key}: ${JSON.stringify(value).substring(0, 100)}...`
            );
          }
        }

        data.positions.push({
          type: 'resource',
          resourceType: resource.type,
          data: resourceData,
        });
      }

      console.log('');
    }

    console.log('');
  }
}

function generateAdapterCode() {
  console.log('\n🔧 ADAPTER UPDATE CODE\n');
  console.log(
    'Based on the actual wallet analysis, here are the precise adapter updates:\n'
  );

  for (const [protocolName, data] of Object.entries(findings)) {
    if (data.contracts.length === 0 && data.resourceTypes.length === 0)
      continue;

    console.log(`### ${protocolName.toUpperCase()} Adapter`);
    console.log('```typescript');

    if (data.contracts.length > 0) {
      console.log('// Contract addresses (VERIFIED):');
      const uniqueContracts = [...new Set(data.contracts)];
      console.log(`const SUPPORTED_PROTOCOLS = [`);
      uniqueContracts.forEach(addr => {
        console.log(`  "${addr}",`);
      });
      console.log(`];`);
      console.log('');
    }

    if (data.resourceTypes.length > 0) {
      console.log('// Resource types to scan (VERIFIED):');
      const uniqueResourceTypes = [...new Set(data.resourceTypes)];
      uniqueResourceTypes.forEach(type => {
        console.log(`// "${type}"`);
      });
      console.log('');
    }

    if (data.entryFunctions.length > 0) {
      console.log('// Entry function patterns (VERIFIED):');
      const uniqueFunctions = [...new Set(data.entryFunctions)];
      uniqueFunctions.forEach(func => {
        const parts = func.split('::');
        if (parts.length >= 3) {
          console.log(`// ${parts[1]}::${parts[2]}`);
        }
      });
      console.log('');
    }

    if (data.positions.length > 0) {
      console.log('// Position scanning logic:');
      console.log(
        'private async scanPositions(walletAddress: string, resources: any[]): Promise<DeFiPosition[]> {'
      );
      console.log('  const positions: DeFiPosition[] = [];');
      console.log('  ');

      for (const contract of [...new Set(data.contracts)]) {
        console.log(`  // Scan for ${contract} resources`);
        console.log(
          `  const relevantResources = resources.filter(r => r.type.includes("${contract.substring(2, 10)}"));`
        );
        console.log('  ');
      }

      console.log('  return positions;');
      console.log('}');
    }

    console.log('```\n');
  }
}

function generateSummary() {
  console.log('\n📊 DISCOVERY SUMMARY\n');

  const totalProtocols = Object.keys(findings).length;
  const protocolsWithPositions = Object.values(findings).filter(
    p => p.positions.length > 0
  ).length;
  const totalPositions = Object.values(findings).reduce(
    (sum, p) => sum + p.positions.length,
    0
  );

  console.log(`✅ Protocols discovered: ${totalProtocols}`);
  console.log(`✅ Protocols with positions: ${protocolsWithPositions}`);
  console.log(`✅ Total positions found: ${totalPositions}`);
  console.log(`✅ Wallet analyzed: ${TARGET_WALLET}`);

  console.log('\n🎯 HIGH CONFIDENCE FINDINGS:');

  for (const [name, data] of Object.entries(findings)) {
    if (data.positions.length > 0) {
      console.log(
        `   ${name.toUpperCase()}: ${data.positions.length} positions, ${data.contracts.length} contracts`
      );
    }
  }

  console.log('\n💡 NEXT STEPS:');
  console.log(
    '   1. Update specific adapters with the verified contract addresses above'
  );
  console.log('   2. Use the exact resource types for position scanning');
  console.log('   3. Test adapters against this wallet to validate accuracy');
  console.log('   4. Deploy updated adapters to production');
}

async function main() {
  try {
    console.log('🎯 FOCUSED WALLET DISCOVERY');
    console.log('============================\n');
    console.log(`Target: ${TARGET_WALLET}\n`);

    await discoverWalletAssets();
    await discoverWalletActivities();
    await discoverWalletResources();
    await analyzePositions();

    generateAdapterCode();
    generateSummary();

    console.log('\n✅ Focused discovery completed!');
  } catch (error) {
    console.error('❌ Error during focused discovery:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
