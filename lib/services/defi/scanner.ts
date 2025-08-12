import { logger } from "@/lib/utils/core/logger";

import { DefaultPriceService } from "../external/price-service";

// Simple types - compatible with existing converter
export interface DeFiPosition {
  id: string;
  protocol: string;
  type: "lp" | "lending" | "staking" | "farming" | "token" | "derivatives";
  address: string;
  assets: Array<{
    type: string;
    tokenAddress: string;
    symbol: string;
    amount: string;
    valueUSD: number;
    metadata?: Record<string, any>;
  }>;
  totalValueUSD: number;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface ScanResult {
  positions: DeFiPosition[];
  totalValueUSD: number;
  protocols: string[];
  scanDuration: number;
}

// Protocol scanners with restored logic from old adapters
type ProtocolScanner = (
  walletAddress: string,
  priceService: DefaultPriceService,
) => Promise<DeFiPosition[]>;

// Fetch account resources - shared function
async function fetchAccountResources(walletAddress: string): Promise<any[]> {
  const response = await fetch(
    `https://api.mainnet.aptoslabs.com/v1/accounts/${walletAddress}/resources`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch resources: ${response.statusText}`);
  }

  return response.json();
}

// Thala scanner - restored from old adapter
async function scanThala(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // Thala LP tokens
    const lpResources = resources.filter(
      (r) =>
        r.type.includes("::stable_pool::StablePoolToken<") ||
        r.type.includes("::weighted_pool::WeightedPoolToken<"),
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `thala-lp-${resource.type}`,
        protocol: "Thala",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // MOD tokens (CDP)
    const modResources = resources.filter((r) =>
      r.type.includes("mod_coin::MOD>"),
    );

    for (const resource of modResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const tokenAddress = "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD";
      const amount = parseFloat(balance) / Math.pow(10, 8);
      const price = await priceService.getTokenPrice(tokenAddress) || 0;
      const valueUSD = amount * price;

      positions.push({
        id: `thala-mod-${tokenAddress}`,
        protocol: "Thala",
        type: "lending",
        address: walletAddress,
        assets: [{
          type: "borrowed",
          tokenAddress: tokenAddress,
          symbol: "MOD",
          amount: amount.toString(),
          valueUSD,
        }],
        totalValueUSD: valueUSD,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Thala scan failed", error);
  }

  return positions;
}

// LiquidSwap scanner - restored from old adapter
async function scanLiquidSwap(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // LiquidSwap LP tokens - check for specific patterns from old adapter
    const lpResources = resources.filter((r) =>
      r.type.includes("0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::")
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `liquidswap-lp-${resource.type}`,
        protocol: "LiquidSwap",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("LiquidSwap scan failed", error);
  }

  return positions;
}

// Unknown/Generic LP scanner - for protocols I can identify from patterns
async function scanGenericLP(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // Look for LP-like resources we can detect
    const lpPatterns = [
      /lp_rewards::LPCoin/,
      /::LP</,
      /LPToken</,
      /::vcoins::V</,
      /::lp::/i,
    ];

    const potentialLPResources = resources.filter((r) =>
      lpPatterns.some(pattern => pattern.test(r.type))
    );

    for (const resource of potentialLPResources) {
      let balance = "0";
      let protocol = "Unknown";
      
      // Try different data structures
      if (resource.data?.coin?.value) {
        balance = resource.data.coin.value;
      } else if (resource.data?.lp_balance?.value) {
        balance = resource.data.lp_balance.value;
        protocol = "Derivatives"; // Likely derivatives protocol
      } else if (resource.data?.value) {
        balance = resource.data.value;
      }

      if (balance === "0") continue;

      // Try to identify protocol from address
      if (resource.type.includes("1786191d0ce793debfdef9890868abdcdc7053f982ccdd102a72732b3082f31d")) {
        protocol = "Merkle Trade"; // This is Merkle Trade protocol
      } else if (resource.type.includes("b7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896")) {
        protocol = "vCoins";
      }

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `${protocol.toLowerCase().replace(' ', '-')}-${resource.type}`,
        protocol,
        type: protocol === "Derivatives" || protocol === "Merkle Trade" ? "derivatives" : "lp",
        address: walletAddress,
        assets: [{
          type: protocol === "Derivatives" || protocol === "Merkle Trade" ? "derivative" : "lp_token",
          tokenAddress: resource.type,
          symbol: protocol === "Derivatives" ? "LP-Derivatives" : "LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
        metadata: {
          rawData: resource.data,
        },
      });
    }

  } catch (error) {
    logger.error("Generic LP scan failed", error);
  }

  return positions;
}

// Generic token scanner - for regular tokens
async function scanGenericTokens(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    const coinResources = resources.filter((r) =>
      r.type.startsWith("0x1::coin::CoinStore<") && 
      !r.type.includes("AptosCoin") &&
      !r.type.includes("mod_coin::MOD") && // Skip tokens handled by specific scanners
      !r.type.includes("lp_rewards::LPCoin") && // Skip LP tokens
      !r.type.includes("vcoins::V") // Skip wrapped tokens
    );

    for (const resource of coinResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const tokenMatch = resource.type.match(/CoinStore<(.+)>/);
      if (!tokenMatch) continue;

      const tokenAddress = tokenMatch[1];
      const amount = parseFloat(balance) / Math.pow(10, 8); // Assume 8 decimals
      const price = await priceService.getTokenPrice(tokenAddress) || 0;
      const valueUSD = amount * price;

      if (valueUSD > 0.01) { // Only include tokens worth more than $0.01
        positions.push({
          id: `token-${tokenAddress}`,
          protocol: "Token",
          type: "token",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: tokenAddress,
            symbol: extractTokenSymbol(tokenAddress),
            amount: amount.toString(),
            valueUSD,
          }],
          totalValueUSD: valueUSD,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

  } catch (error) {
    logger.error("Generic token scan failed", error);
  }

  return positions;
}

function extractTokenSymbol(tokenAddress: string): string {
  const match = tokenAddress.match(/::([^:]+)$/);
  return match ? match[1].toUpperCase() : "UNKNOWN";
}

// Aries Markets scanner - lending protocol
async function scanAries(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // Aries protocol address
    const ariesAddress = "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3";

    // Look for lending positions
    const lendingResources = resources.filter(r =>
      r.type.includes(ariesAddress) &&
      (r.type.includes("::lending_pool::") || r.type.includes("::pool::UserReserve"))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;
      
      // Supplied positions
      const suppliedAmount = data?.supplied_amount || data?.deposit_amount || "0";
      if (suppliedAmount !== "0") {
        const amount = parseFloat(suppliedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `aries-supply-${assetType}`,
          protocol: "Aries Markets",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.supply_apy ? parseFloat(data.supply_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }

      // Borrowed positions  
      const borrowedAmount = data?.borrowed_amount || data?.debt_amount || "0";
      if (borrowedAmount !== "0") {
        const amount = parseFloat(borrowedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `aries-borrow-${assetType}`,
          protocol: "Aries Markets", 
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "borrowed",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.borrow_apy ? parseFloat(data.borrow_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

  } catch (error) {
    logger.error("Aries scan failed", error);
  }

  return positions;
}

// PancakeSwap scanner - DEX protocol
async function scanPancakeSwap(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // PancakeSwap protocol address
    const pancakeAddress = "0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(pancakeAddress) && 
      (r.type.includes("::LPToken<") || r.type.includes("::lp_coin::LP<"))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `pancakeswap-lp-${resource.type}`,
        protocol: "PancakeSwap",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "CAKE-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Staking positions - CAKE staking
    const stakingResources = resources.filter(r =>
      r.type.includes(pancakeAddress) &&
      (r.type.includes("::stake::") || r.type.includes("::farming::"))
    );

    for (const resource of stakingResources) {
      const balance = resource.data?.amount || resource.data?.staked_amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `pancakeswap-stake-${resource.type}`,
        protocol: "PancakeSwap",
        type: "staking",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "CAKE",
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            rewards: resource.data?.pending_rewards || "0",
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("PancakeSwap scan failed", error);
  }

  return positions;
}

// Cellana Finance scanner - DEX protocol
async function scanCellana(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // Cellana protocol address
    const cellanaAddress = "0x2ebb2ccac5e027a8cd2a0f0d8c2e86c919e8b51441b641b46aaed7c6e5ddc056";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(cellanaAddress) &&
      (r.type.includes("::lp_coin::LP<") || r.type.includes("::LPCoin<"))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `cellana-lp-${resource.type}`,
        protocol: "Cellana Finance",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "CELL-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Farming positions
    const farmResources = resources.filter(r =>
      r.type.includes(cellanaAddress) &&
      (r.type.includes("::masterchef::") || r.type.includes("::farm::"))
    );

    for (const resource of farmResources) {
      const balance = resource.data?.amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `cellana-farm-${resource.type}`,
        protocol: "Cellana Finance",
        type: "farming",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "CELL-FARM",
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            rewards: resource.data?.pending_rewards || "0",
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Cellana scan failed", error);
  }

  return positions;
}

// SushiSwap scanner - DEX protocol  
async function scanSushiSwap(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // SushiSwap protocol address
    const sushiAddress = "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203114f988eb1";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(sushiAddress) &&
      r.type.includes("::lp_coin::LP<")
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `sushiswap-lp-${resource.type}`,
        protocol: "SushiSwap",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "SUSHI-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // MasterChef/MiniChef staking
    const farmResources = resources.filter(r =>
      r.type.includes(sushiAddress) &&
      (r.type.includes("::masterchef::") || r.type.includes("::minichef::"))
    );

    for (const resource of farmResources) {
      const balance = resource.data?.amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `sushiswap-farm-${resource.type}`,
        protocol: "SushiSwap",
        type: "farming",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "SUSHI-FARM",
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            rewards: resource.data?.pending_sushi || "0",
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("SushiSwap scan failed", error);
  }

  return positions;
}

// Echelon scanner - lending protocol
async function scanEchelon(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);

    // Echelon protocol addresses
    const echelonAddresses = [
      "0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba",
      "0x024c90c44edf46aa02c3e370725b918a59c52b5aa551388feb258bd5a1e82271",
    ];

    // Supplied positions
    const lendingResources = resources.filter(r =>
      echelonAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::lending::") || r.type.includes("::market::") || r.type.includes("::supply::"))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;
      const suppliedAmount = data?.supplied || data?.deposit_amount || data?.balance || "0";
      
      if (suppliedAmount !== "0") {
        const amount = parseFloat(suppliedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `echelon-supply-${assetType}`,
          protocol: "Echelon",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.supply_apy ? parseFloat(data.supply_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Borrowed positions
    const borrowResources = resources.filter(r =>
      echelonAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::borrow::") || r.type.includes("::debt::") || r.type.includes("::loan::"))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;
      const borrowedAmount = data?.borrowed || data?.debt_amount || data?.loan_amount || "0";
      
      if (borrowedAmount !== "0") {
        const amount = parseFloat(borrowedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `echelon-borrow-${assetType}`,
          protocol: "Echelon",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "borrowed",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.borrow_apy ? parseFloat(data.borrow_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Yield tokens (eTokens)
    const yieldTokenResources = resources.filter(r =>
      echelonAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::yield_token::") || r.type.includes("::e_token::"))
    );

    for (const resource of yieldTokenResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      const underlyingAsset = extractAssetFromType(resource.type);
      
      positions.push({
        id: `echelon-yield-${resource.type}`,
        protocol: "Echelon",
        type: "lending",
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: `e${extractTokenSymbol(underlyingAsset)}`,
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            underlying: underlyingAsset,
            isInterestBearing: true,
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Echelon scan failed", error);
  }

  return positions;
}

// Echo Lending scanner - lending protocol
async function scanEcho(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const echoAddresses = [
      "0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed",
      "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec",
    ];

    // Lending positions
    const lendingResources = resources.filter(r =>
      echoAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::lending_pool::") || r.type.includes("::deposits::"))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;
      const depositAmount = data?.deposit_amount || data?.principal || "0";
      
      if (depositAmount !== "0") {
        const amount = parseFloat(depositAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `echo-supply-${assetType}`,
          protocol: "Echo Lending",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.current_apy ? parseFloat(data.current_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Borrowing positions  
    const borrowResources = resources.filter(r =>
      echoAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::loans::") || r.type.includes("::borrowing::"))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;
      const borrowAmount = data?.borrow_amount || data?.principal || "0";
      
      if (borrowAmount !== "0") {
        const amount = parseFloat(borrowAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `echo-borrow-${assetType}`,
          protocol: "Echo Lending",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "borrowed",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.borrow_rate ? parseFloat(data.borrow_rate) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

  } catch (error) {
    logger.error("Echo scan failed", error);
  }

  return positions;
}

// Meso Finance scanner - lending protocol  
async function scanMeso(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const mesoAddress = "0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7";

    // Supply positions
    const supplyResources = resources.filter(r =>
      r.type.includes(mesoAddress) &&
      (r.type.includes("::supply::") || r.type.includes("::deposit::"))
    );

    for (const resource of supplyResources) {
      const data = resource.data as any;
      const suppliedAmount = data?.supplied_amount || data?.balance || "0";
      
      if (suppliedAmount !== "0") {
        const amount = parseFloat(suppliedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `meso-supply-${assetType}`,
          protocol: "Meso Finance",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.supply_apy ? parseFloat(data.supply_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Borrow positions
    const borrowResources = resources.filter(r =>
      r.type.includes(mesoAddress) &&
      (r.type.includes("::borrow::") || r.type.includes("::loan::"))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;
      const borrowedAmount = data?.borrowed_amount || data?.principal || "0";
      
      if (borrowedAmount !== "0") {
        const amount = parseFloat(borrowedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `meso-borrow-${assetType}`,
          protocol: "Meso Finance",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "borrowed",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.borrow_apy ? parseFloat(data.borrow_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // mTokens (interest bearing)
    const mTokenResources = resources.filter(r =>
      r.type.includes(mesoAddress) &&
      (r.type.includes("::mtoken::") || r.type.includes("::m_token::"))
    );

    for (const resource of mTokenResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      const underlyingAsset = extractAssetFromType(resource.type);
      
      positions.push({
        id: `meso-mtoken-${resource.type}`,
        protocol: "Meso Finance",
        type: "lending",
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: `m${extractTokenSymbol(underlyingAsset)}`,
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            underlying: underlyingAsset,
            isInterestBearing: true,
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Meso scan failed", error);
  }

  return positions;
}

// Joule Finance scanner - lending protocol
async function scanJoule(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const jouleAddresses = [
      "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6",
      "0x3b90501eae5cdc53c507d53b4ddc5a37e620743ef0b53a6aa4f711118890d1e5",
    ];

    // Lending positions
    const lendingResources = resources.filter(r =>
      jouleAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::lending::") || r.type.includes("::market::"))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;
      const depositAmount = data?.deposited || data?.supplied_amount || "0";
      
      if (depositAmount !== "0") {
        const amount = parseFloat(depositAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `joule-supply-${assetType}`,
          protocol: "Joule Finance",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.supply_apy ? parseFloat(data.supply_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Borrowing positions
    const borrowResources = resources.filter(r =>
      jouleAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::borrow::") || r.type.includes("::debt::"))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;
      const borrowAmount = data?.borrowed || data?.debt_amount || "0";
      
      if (borrowAmount !== "0") {
        const amount = parseFloat(borrowAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `joule-borrow-${assetType}`,
          protocol: "Joule Finance", 
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "borrowed",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.borrow_apy ? parseFloat(data.borrow_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // jTokens (receipt tokens)
    const jTokenResources = resources.filter(r =>
      jouleAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::jtoken::") || r.type.includes("::j_token::"))
    );

    for (const resource of jTokenResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      const underlyingAsset = extractAssetFromType(resource.type);
      
      positions.push({
        id: `joule-jtoken-${resource.type}`,
        protocol: "Joule Finance",
        type: "lending",
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: `j${extractTokenSymbol(underlyingAsset)}`,
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            underlying: underlyingAsset,
            isInterestBearing: true,
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Joule scan failed", error);
  }

  return positions;
}

// Superposition scanner - lending protocol
async function scanSuperposition(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const superpositionAddress = "0xccd1a84ccea93531d7f165b90134aa0415feb30e8757ab1632dac68c0055f5c2";

    // Lending positions
    const lendingResources = resources.filter(r =>
      r.type.includes(superpositionAddress) &&
      (r.type.includes("::lending::") || r.type.includes("::position::"))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;
      const suppliedAmount = data?.supplied || data?.deposit_amount || "0";
      
      if (suppliedAmount !== "0") {
        const amount = parseFloat(suppliedAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `superposition-supply-${assetType}`,
          protocol: "Superposition",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "supplied",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.supply_apy ? parseFloat(data.supply_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Borrowing positions
    const borrowResources = resources.filter(r =>
      r.type.includes(superpositionAddress) &&
      (r.type.includes("::borrow::") || r.type.includes("::debt::"))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;
      const borrowAmount = data?.borrowed || data?.debt || "0";
      
      if (borrowAmount !== "0") {
        const amount = parseFloat(borrowAmount) / Math.pow(10, 8);
        const assetType = extractAssetFromType(resource.type);
        
        positions.push({
          id: `superposition-borrow-${assetType}`,
          protocol: "Superposition",
          type: "lending",
          address: walletAddress,
          assets: [{
            type: "borrowed",
            tokenAddress: assetType,
            symbol: extractTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD: 0,
            metadata: {
              apy: data?.borrow_apy ? parseFloat(data.borrow_apy) / 100 : undefined,
            },
          }],
          totalValueUSD: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // sTokens (yield bearing)
    const sTokenResources = resources.filter(r =>
      r.type.includes(superpositionAddress) &&
      (r.type.includes("::stoken::") || r.type.includes("::s_token::"))
    );

    for (const resource of sTokenResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      const underlyingAsset = extractAssetFromType(resource.type);
      
      positions.push({
        id: `superposition-stoken-${resource.type}`,
        protocol: "Superposition",
        type: "lending",
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: `s${extractTokenSymbol(underlyingAsset)}`,
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            underlying: underlyingAsset,
            isInterestBearing: true,
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Superposition scan failed", error);
  }

  return positions;
}

// Hyperion scanner - DEX protocol
async function scanHyperion(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const hyperionAddress = "0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(hyperionAddress) &&
      (r.type.includes("::amm::") || r.type.includes("::pool::"))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || resource.data?.lp_balance || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `hyperion-lp-${resource.type}`,
        protocol: "Hyperion",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "HYP-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Staking positions
    const stakingResources = resources.filter(r =>
      r.type.includes(hyperionAddress) &&
      (r.type.includes("::staking::") || r.type.includes("::farm::"))
    );

    for (const resource of stakingResources) {
      const balance = resource.data?.amount || resource.data?.staked_amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `hyperion-stake-${resource.type}`,
        protocol: "Hyperion",
        type: "staking",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "HYP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Hyperion scan failed", error);
  }

  return positions;
}

// Panora Exchange scanner - DEX protocol  
async function scanPanoraExchange(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const panoraAddress = "0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(panoraAddress) &&
      (r.type.includes("::pool::") || r.type.includes("::liquidity::"))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.lp_tokens || resource.data?.shares || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `panora-lp-${resource.type}`,
        protocol: "Panora Exchange",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "PANORA-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Limit orders
    const orderResources = resources.filter(r =>
      r.type.includes(panoraAddress) &&
      r.type.includes("::order::")
    );

    for (const resource of orderResources) {
      const amount = resource.data?.amount || "0";
      if (amount === "0") continue;

      const orderAmount = parseFloat(amount) / Math.pow(10, 8);
      
      positions.push({
        id: `panora-order-${resource.type}`,
        protocol: "Panora Exchange",
        type: "lp", // Orders are like pending liquidity
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: "ORDER",
          amount: orderAmount.toString(),
          valueUSD: 0,
          metadata: {
            orderType: "limit_order",
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Panora Exchange scan failed", error);
  }

  return positions;
}

// VibrantX scanner - DEX protocol
async function scanVibrantX(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const vibrantXAddress = "0x17f1e926a81639e9557f4e4934df93452945ec30bc962e11351db59eb0d78c33";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(vibrantXAddress) &&
      (r.type.includes("::lp::") || r.type.includes("::pool::LPToken<"))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `vibrantx-lp-${resource.type}`,
        protocol: "VibrantX",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "VX-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Staking positions
    const stakingResources = resources.filter(r =>
      r.type.includes(vibrantXAddress) &&
      r.type.includes("::staking::")
    );

    for (const resource of stakingResources) {
      const balance = resource.data?.staked_amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `vibrantx-stake-${resource.type}`,
        protocol: "VibrantX",
        type: "staking",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "VX",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Farming positions
    const farmResources = resources.filter(r =>
      r.type.includes(vibrantXAddress) &&
      r.type.includes("::farming::")
    );

    for (const resource of farmResources) {
      const balance = resource.data?.farmed_amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `vibrantx-farm-${resource.type}`,
        protocol: "VibrantX",
        type: "farming",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "VX-FARM",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("VibrantX scan failed", error);
  }

  return positions;
}

// Kana Labs scanner - DEX/Perps protocol
async function scanKanaLabs(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const kanaAddresses = [
      "0x9538c839fe490ccfaf32ad9f7491b5e84e610ff6edc110ff883f06ebde82463d",
      "0x7a38039fffd016adcac2c53795ee49325e5ec6fddf3bf02651c09f9a583655a6",
    ];

    // LP tokens
    const lpResources = resources.filter(r =>
      kanaAddresses.some(addr => r.type.includes(addr)) &&
      r.type.includes("::lp::")
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `kana-lp-${resource.type}`,
        protocol: "Kana Labs",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "KANA-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Perps positions (derivatives)
    const perpsResources = resources.filter(r =>
      kanaAddresses.some(addr => r.type.includes(addr)) &&
      (r.type.includes("::perps::") || r.type.includes("::position::"))
    );

    for (const resource of perpsResources) {
      const balance = resource.data?.position_size || resource.data?.collateral || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `kana-perps-${resource.type}`,
        protocol: "Kana Labs",
        type: "derivatives",
        address: walletAddress,
        assets: [{
          type: "derivative",
          tokenAddress: resource.type,
          symbol: "KANA-PERPS",
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            positionType: resource.data?.is_long ? "long" : "short",
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Staking positions  
    const stakingResources = resources.filter(r =>
      kanaAddresses.some(addr => r.type.includes(addr)) &&
      r.type.includes("::staking::")
    );

    for (const resource of stakingResources) {
      const balance = resource.data?.staked_amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `kana-stake-${resource.type}`,
        protocol: "Kana Labs",
        type: "staking",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "KANA",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Kana Labs scan failed", error);
  }

  return positions;
}

// Thetis Market scanner - DEX protocol
async function scanThetis(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const thetisAddress = "0x0c727553dd5019c4887581f0a89dca9c8ea400116d70e9da7164897812c6646e";

    // LP tokens
    const lpResources = resources.filter(r =>
      r.type.includes(thetisAddress) &&
      (r.type.includes("::lp::") || r.type.includes("::pool::"))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `thetis-lp-${resource.type}`,
        protocol: "Thetis Market",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "THETIS-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Staking positions
    const stakingResources = resources.filter(r =>
      r.type.includes(thetisAddress) &&
      r.type.includes("::staking::")
    );

    for (const resource of stakingResources) {
      const balance = resource.data?.staked_amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `thetis-stake-${resource.type}`,
        protocol: "Thetis Market",
        type: "staking",
        address: walletAddress,
        assets: [{
          type: "staked",
          tokenAddress: resource.type,
          symbol: "THETIS",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Vault positions
    const vaultResources = resources.filter(r =>
      r.type.includes(thetisAddress) &&
      r.type.includes("::vault::")
    );

    for (const resource of vaultResources) {
      const balance = resource.data?.shares || resource.data?.deposited || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `thetis-vault-${resource.type}`,
        protocol: "Thetis Market",
        type: "staking", // Vaults are like staking
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: "THETIS-VAULT",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("Thetis scan failed", error);
  }

  return positions;
}

// UptosPump scanner - Meme coin launchpad  
async function scanUptosPump(
  walletAddress: string,
  priceService: DefaultPriceService,
): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];
  
  try {
    const resources = await fetchAccountResources(walletAddress);
    const uptosAddress = "0x4e5e85fd647c7e19560590831616a3c021080265576af3182535a1d19e8bc2b3";

    // Meme coin LP positions
    const lpResources = resources.filter(r =>
      r.type.includes(uptosAddress) &&
      r.type.includes("::lp::")
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `uptos-lp-${resource.type}`,
        protocol: "UptosPump",
        type: "lp",
        address: walletAddress,
        assets: [{
          type: "lp_token",
          tokenAddress: resource.type,
          symbol: "UPTOS-LP",
          amount: amount.toString(),
          valueUSD: 0,
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Bonding curve positions  
    const bondingResources = resources.filter(r =>
      r.type.includes(uptosAddress) &&
      r.type.includes("::bonding::")
    );

    for (const resource of bondingResources) {
      const balance = resource.data?.tokens || resource.data?.amount || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `uptos-bonding-${resource.type}`,
        protocol: "UptosPump",
        type: "token", // Bonding curve tokens
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: "MEME-TOKEN",
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            bondingCurve: true,
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Creator/launch positions
    const creatorResources = resources.filter(r =>
      r.type.includes(uptosAddress) &&
      (r.type.includes("::creator::") || r.type.includes("::launch::"))
    );

    for (const resource of creatorResources) {
      const balance = resource.data?.created_tokens || resource.data?.fees_earned || "0";
      if (balance === "0") continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);
      
      positions.push({
        id: `uptos-creator-${resource.type}`,
        protocol: "UptosPump",
        type: "token",
        address: walletAddress,
        assets: [{
          type: "supplied",
          tokenAddress: resource.type,
          symbol: "CREATOR-FEES",
          amount: amount.toString(),
          valueUSD: 0,
          metadata: {
            creatorPosition: true,
          },
        }],
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error("UptosPump scan failed", error);
  }

  return positions;
}

// Helper function to extract asset type from resource type
function extractAssetFromType(resourceType: string): string {
  const match = resourceType.match(/<([^<>]+)>/);
  return match ? match[1].split(',')[0].trim() : resourceType;
}

// All available scanners - adding key protocols that we detected in wallet
const PROTOCOL_SCANNERS: ProtocolScanner[] = [
  scanThala,
  scanLiquidSwap,
  scanAries,           // ⭐ Found in wallet: 0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3
  scanGenericLP,       // This will catch many protocols we missed  
  scanGenericTokens,   // Keep this last as fallback
];

// Main scan function
export async function scanDeFiPositions(
  walletAddress: string,
  options: { minValueUSD?: number } = {},
): Promise<ScanResult> {
  const startTime = Date.now();
  
  logger.info("Starting comprehensive DeFi scan", { 
    walletAddress, 
    totalScanners: PROTOCOL_SCANNERS.length,
    scannerNames: PROTOCOL_SCANNERS.map(scanner => scanner.name).join(', ')
  });

  // Run all scanners in parallel
  const scannerResults = await Promise.allSettled(
    PROTOCOL_SCANNERS.map(scanner => scanner(walletAddress, new DefaultPriceService()))
  );

  // Flatten results
  const allPositions = scannerResults
    .filter((result): result is PromiseFulfilledResult<DeFiPosition[]> => 
      result.status === 'fulfilled'
    )
    .flatMap(result => result.value);

  // Filter by minimum value
  const filteredPositions = options.minValueUSD 
    ? allPositions.filter(pos => pos.totalValueUSD >= options.minValueUSD!)
    : allPositions;

  // Sort by value
  const sortedPositions = filteredPositions.sort(
    (a, b) => b.totalValueUSD - a.totalValueUSD
  );

  const totalValueUSD = sortedPositions.reduce(
    (sum, pos) => sum + pos.totalValueUSD, 
    0
  );

  const protocols = Array.from(new Set(sortedPositions.map(pos => pos.protocol)));
  const scanDuration = Date.now() - startTime;

  // Log detailed scan results
  const succeededScanners = scannerResults.filter(result => result.status === 'fulfilled').length;
  const failedScanners = scannerResults.filter(result => result.status === 'rejected').length;
  
  logger.info("Comprehensive DeFi scan completed", {
    walletAddress,
    totalPositions: sortedPositions.length,
    totalValueUSD,
    protocols: protocols.length,
    protocolList: protocols,
    scanDuration,
    scannerStats: {
      total: PROTOCOL_SCANNERS.length,
      succeeded: succeededScanners,
      failed: failedScanners
    }
  });
  
  // Log any failed scanners for debugging
  scannerResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error(`Scanner ${PROTOCOL_SCANNERS[index].name || `#${index}`} failed:`, result.reason);
    }
  });

  return {
    positions: sortedPositions,
    totalValueUSD,
    protocols,
    scanDuration,
  };
}