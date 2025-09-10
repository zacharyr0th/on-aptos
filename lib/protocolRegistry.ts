// Protocol registry for Aptos blockchain
// Maps protocol addresses to their names and metadata

export interface ProtocolInfo {
  name: string;
  label: string;
  type:
    | "DEX"
    | "LENDING"
    | "LIQUID_STAKING"
    | "FARMING"
    | "DERIVATIVES"
    | "BRIDGE"
    | "NFT"
    | "INFRASTRUCTURE";
  addresses: string[];
  description?: string;
}

// Main protocol registry with comprehensive mappings
export const PROTOCOL_REGISTRY: Record<string, ProtocolInfo> = {
  // Core Aptos System Contracts
  APTOS_FRAMEWORK: {
    name: "Aptos Framework",
    label: "Aptos",
    type: "INFRASTRUCTURE",
    addresses: ["0x0000000000000000000000000000000000000000000000000000000000000001", "0x1", "0x0"],
    description: "Core Aptos framework and system contracts",
  },

  APTOS_COIN: {
    name: "Aptos Coin",
    label: "APT",
    type: "INFRASTRUCTURE",
    addresses: ["0x1::aptos_coin"],
    description: "Native APT token",
  },

  // High activity protocol - needs proper identification
  PROTOCOL_0X2387: {
    name: "Protocol 0x2387",
    label: "0x2387",
    type: "INFRASTRUCTURE",
    addresses: ["0x238766903ac07171f2ff4cc8636b9c812890820dc12e9a5de922e1a097c172f", "0x2387"],
    description: "High activity protocol with 1.7M+ active senders",
  },

  // Common system addresses
  SYSTEM_ADDRESSES: {
    name: "System Contracts",
    label: "System",
    type: "INFRASTRUCTURE",
    addresses: ["0xbc35f33a9cc8f1f95b59c61e060b2e8efb2eccd3", "0xbc35"],
    description: "System-level contracts",
  },

  // DEX Protocols
  THALASWAP: {
    name: "ThalaSwap",
    label: "Thala",
    type: "DEX",
    addresses: ["0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af"],
    description: "Native Aptos DEX by Thala Labs",
  },

  LIQUIDSWAP: {
    name: "LiquidSwap",
    label: "LiquidSwap",
    type: "DEX",
    addresses: [
      "0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948",
      "0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8",
      "0x3851f155e7fc5ec98ce9dbcaf04b2cb0521c562463bd128f9d1331b38c497cf3",
      "0xeef5ce9727e7faf3b83cb0630e91d45612eac563f670eecaadf1cb22c3bdfdfb",
      "0x4763c5cfde8517f48e930f7ece14806d75b98ce31b0b4eab99f49a067f5b5ef2",
    ],
    description: "Native Aptos DEX with multiple versions",
  },

  PANCAKESWAP: {
    name: "PancakeSwap",
    label: "CAKE",
    type: "DEX",
    addresses: [
      "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa",
      "0x7968a225eba6c99f5f1070aeec1b405757dee939eabcfda43ba91588bf5fccf3",
      "0xfd1d8a523f1be89277ac0787ae3469312667e3d0b3f75a5f01bfc95530a2dc91",
      "0x9936836587ca33240d3d3f91844651b16cb07802faf5e34514ed6f78580deb0a",
      "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e",
    ],
    description: "Decentralized exchange and farming",
  },

  SUSHISWAP: {
    name: "SushiSwap",
    label: "SUSHI",
    type: "DEX",
    addresses: ["0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c"],
    description: "SushiSwap on Aptos",
  },

  CETUS: {
    name: "Cetus Protocol",
    label: "Cetus",
    type: "DEX",
    addresses: [
      "0xec42a352cc65eca17a9fa85d0fc602295897ed6b8b8af6a6c79ef490eb8f9eba",
      "0xa7f01413d33ba919441888637ca1607ca0ddcbfa3c0a9ddea64743aaa560e498",
    ],
    description: "Concentrated liquidity DEX",
  },

  AUX_EXCHANGE: {
    name: "AUX Exchange",
    label: "AUX",
    type: "DEX",
    addresses: ["0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541"],
    description: "AMM DEX on Aptos",
  },

  APTOSWAP: {
    name: "AptoSwap",
    label: "AptoSwap",
    type: "DEX",
    addresses: ["0xa5d3ac4d429052674ed38adc62d010e52d7c24ca159194d17ddc196ddb7e480b"],
    description: "DEX with pool liquidity tracking",
  },

  // Lending Protocols
  ARIES_MARKETS: {
    name: "Aries Markets",
    label: "Aries",
    type: "LENDING",
    addresses: ["0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3"],
    description: "Lending and borrowing protocol",
  },

  AAVE_APTOS: {
    name: "Aave Aptos",
    label: "Aave",
    type: "LENDING",
    addresses: ["0x39ddcd9e1a39fa14f25e3f9ec8a86074d05cc0881cbf667df8a6ee70942016fb"],
    description: "Aave-like lending protocol on Aptos",
  },

  APTIN_FINANCE: {
    name: "Aptin Finance",
    label: "Aptin",
    type: "LENDING",
    addresses: [
      "0xabaf41ed192141b481434b99227f2b28c313681bc76714dc88e5b2e26b24b84c",
      "0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896",
    ],
    description: "Lending protocol on Aptos",
  },

  ECHELON: {
    name: "Echelon Market",
    label: "Echelon",
    type: "LENDING",
    addresses: ["0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba"],
    description: "Lending and borrowing market",
  },

  // Liquid Staking
  AMNIS_FINANCE: {
    name: "Amnis Finance",
    label: "Amnis",
    type: "LIQUID_STAKING",
    addresses: [
      "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a",
      "0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387",
      "0x6f09bf7a232a2159ce8b0af83d641d7bdeda0921f724764e94e4f9b2d7e0d261",
      "0x7893a5d6cd60610f2bad22bb29668e596d14245b682d508a0794ce69613bcaab",
    ],
    description: "Liquid staking protocol for APT",
  },

  THALA_LSD: {
    name: "Thala Liquid Staking",
    label: "thAPT",
    type: "LIQUID_STAKING",
    addresses: ["0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6"],
    description: "Thala liquid staking derivatives",
  },

  TORTUGA: {
    name: "Tortuga Finance",
    label: "Tortuga",
    type: "LIQUID_STAKING",
    addresses: ["0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114"],
    description: "Liquid staking protocol for Aptos",
  },

  DITTO: {
    name: "Ditto Staking",
    label: "Ditto",
    type: "LIQUID_STAKING",
    addresses: ["0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5"],
    description: "Aptos staking pool protocol",
  },

  TRUFIN: {
    name: "TruFin Protocol",
    label: "TruFin",
    type: "LIQUID_STAKING",
    addresses: ["0xfbab9fb68bd2103925317b6a540baa20087b1e7a7a4eb90badee04abb6b5a16f"],
    description: "Liquid staking solution",
  },

  // Farming/Yield
  THALA_FARM: {
    name: "Thala Farm",
    label: "Thala Farm",
    type: "FARMING",
    addresses: [
      "0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99",
      "0x3c4a58b4a8dffe6d14448072efcdd5a0e0089a22c6837b94f1d7e8bb1552137f",
      "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d",
    ],
    description: "Yield farming and liquidity pools",
  },

  // Derivatives
  MERKLE_TRADE: {
    name: "Merkle Trade",
    label: "MKLP",
    type: "DERIVATIVES",
    addresses: ["0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06"],
    description: "Derivatives trading protocol",
  },

  // Bridge Protocols
  WORMHOLE: {
    name: "Wormhole Bridge",
    label: "Wormhole",
    type: "BRIDGE",
    addresses: ["0x576410486a2da45eee6c949c995670112ddf2fbeedab20350d506328eefc9d4f"],
    description: "Cross-chain bridge",
  },

  CELER_BRIDGE: {
    name: "Celer Bridge",
    label: "Celer",
    type: "BRIDGE",
    addresses: ["0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d"],
    description: "Cross-chain bridge protocol",
  },

  LAYERZERO: {
    name: "LayerZero",
    label: "LayerZero",
    type: "BRIDGE",
    addresses: ["0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa"],
    description: "Omnichain interoperability protocol",
  },

  // NFT Marketplaces
  WAPAL: {
    name: "Wapal",
    label: "Wapal",
    type: "NFT",
    addresses: ["0x80d3b43e38fb0fde5f5c671c8db06e2c5fe92de0947de9e25797e7b690e0a466"],
    description: "NFT marketplace",
  },

  MERCATO: {
    name: "Mercato",
    label: "Mercato",
    type: "NFT",
    addresses: ["0x7897c0ee0e1fb5055f4e35c6ef96a95a3e5e599a48b9eb436a5685a00efb0038"],
    description: "NFT trading platform",
  },

  BLUEMOVE: {
    name: "BlueMove",
    label: "BlueMove",
    type: "NFT",
    addresses: ["0xd1fd99c3c7e36eb23d13462173933fa088f87f3c067a6ff74c6dd1a0f5e2158e"],
    description: "NFT marketplace and launchpad",
  },

  EMOJICOIN_FUN: {
    name: "Emojicoin.fun",
    label: "Emojicoin",
    type: "NFT",
    addresses: ["0xface729284ae5729100b3a9ad7f7cc025ea09739cd6e7252aff0beb53619cafe"],
    description: "NFT and meme token platform",
  },

  // Infrastructure
  APTOSLAUNCH: {
    name: "AptosLaunch",
    label: "AptosLaunch",
    type: "INFRASTRUCTURE",
    addresses: ["0xd0b4efb4be7c3508d9a26a9b5405cf9f860d0b9e5fe2f498b90e68b8d2cedd3e"],
    description: "Token launchpad platform",
  },
};

// Helper function to get protocol info by address
export function getProtocolByAddress(address: string): ProtocolInfo | null {
  if (!address) return null;

  // Normalize address to lowercase for comparison
  const normalizedAddress = address.toLowerCase().trim();

  // Check for exact matches first
  for (const protocol of Object.values(PROTOCOL_REGISTRY)) {
    for (const protocolAddress of protocol.addresses) {
      const normalizedProtocol = protocolAddress.toLowerCase();

      // Exact match
      if (normalizedProtocol === normalizedAddress) {
        return protocol;
      }

      // Check if either starts with the other (handles partial addresses)
      if (
        normalizedAddress.startsWith(normalizedProtocol) ||
        normalizedProtocol.startsWith(normalizedAddress)
      ) {
        return protocol;
      }

      // Check if the address contains the protocol address (for module addresses)
      if (normalizedAddress.includes(normalizedProtocol)) {
        return protocol;
      }
    }
  }

  // Special case: check if it's a shortened address that matches
  const shortAddress = normalizedAddress.slice(0, 6);
  for (const protocol of Object.values(PROTOCOL_REGISTRY)) {
    for (const protocolAddress of protocol.addresses) {
      if (protocolAddress.toLowerCase().startsWith(shortAddress)) {
        return protocol;
      }
    }
  }

  return null;
}

// Helper function to get protocol name or fallback to shortened address
export function getProtocolName(address: string): string {
  if (!address) return "Unknown";

  const protocol = getProtocolByAddress(address);
  if (protocol) {
    return protocol.name;
  }

  // Special handling for common addresses
  const lowerAddr = address.toLowerCase();

  // Check for Aptos framework addresses
  if (
    lowerAddr === "0x1" ||
    lowerAddr === "0x0" ||
    lowerAddr === "0x0000000000000000000000000000000000000000000000000000000000000001"
  ) {
    return "Aptos Framework";
  }

  // Check for high activity protocol 0x2387
  if (lowerAddr.startsWith("0x2387") || lowerAddr.includes("238766903ac07171f2ff4cc")) {
    return "Protocol 0x2387";
  }

  // Check for common protocols by partial match
  if (lowerAddr.startsWith("0x48271d39") || lowerAddr.includes("48271d39")) {
    return "ThalaSwap";
  }

  if (lowerAddr.startsWith("0x05a97986") || lowerAddr.includes("05a97986")) {
    return "LiquidSwap";
  }

  if (
    lowerAddr.startsWith("0x163df34f") ||
    lowerAddr.includes("163df34f") ||
    lowerAddr.startsWith("0xc7efb407") ||
    lowerAddr.includes("c7efb407")
  ) {
    return "PancakeSwap";
  }

  if (lowerAddr.startsWith("0x31a6675c") || lowerAddr.includes("31a6675c")) {
    return "SushiSwap";
  }

  if (lowerAddr.startsWith("0xbc35") || lowerAddr.includes("bc35f33a9cc8f1f95b59")) {
    return "System Contracts";
  }

  // Return shortened address as fallback
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper function to get protocol label
export function getProtocolLabel(address: string): string {
  const protocol = getProtocolByAddress(address);
  return protocol?.label || address.slice(0, 8);
}
