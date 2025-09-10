/**
 * Known Aptos-related addresses for identification and labeling
 * This file consolidates addresses that don't fit into other categories
 * Protocol addresses are in protocol-registry.ts
 * CEX and NFT addresses are in platforms.ts
 */

import { PROTOCOLS } from "../protocols/protocol-registry";
import { CEX_ADDRESSES, NFT_PLATFORMS } from "./platforms";

// Helper to get protocol name by address
const getProtocolName = (address: string): string | undefined => {
  for (const protocol of Object.values(PROTOCOLS)) {
    if (protocol.addresses.includes(address)) {
      return protocol.name;
    }
  }
  return undefined;
};

// Build the known addresses map dynamically
export const knownAptosRelatedAddresses: Record<string, string> = {
  "0x0000000000000000000000000000000000000000000000000000000000000001": "Framework (0x1)",
  "0x0000000000000000000000000000000000000000000000000000000000000003": "Legacy Token (0x3)",
  "0x0000000000000000000000000000000000000000000000000000000000000004": "Digital Assets (0x4)",
  "0x000000000000000000000000000000000000000000000000000000000000000A": "Aptos Coin Fungible Asset",
  "0xdcc43c54a666493b6cbfc1ecc81af0bc24e9b75c5ab3a7065c1fc9632ee8bd82": "GovScan Voting",
  // Bridges are defined in protocol-registry.ts
  // DEX protocols are defined in protocol-registry.ts
  // Lending protocols are defined in protocol-registry.ts
  // Liquid staking protocols are defined in protocol-registry.ts
  // Other DeFi protocols are defined in protocol-registry.ts

  // Special addresses not in protocol-registry
  "0xd47ead75b923422f7967257259e7a298f029da9e5484dc7aa1a9efbd4c3ae648": "Native FA Redemption",
  // NFT marketplaces are defined in platforms.ts
  // Additional NFT-related addresses
  "0x80d0084f99070c5cdb4b01b695f2a8b44017e41abf4a78c2487d3b52b5a4ae37": "Wapal Auction",
  "0xc777f5f82a2773d6e6f9c2e91306fc9c099a57747f64d86c59cf0acab706fd44": "Wapal Launchpad V2",
  "0x6547d9f1d481fdc21cd38c730c07974f2f61adb7063e76f9d9522ab91f090dac": "Wapal Launchpad",
  "0x86a32dcdd605152e58b984ac2538168214bb57ab4661c591a095563b3d2d6a37": "Tradeport Launchpad",
  "0x039e8ef8576a8eaf8ebcea5841cc7110bc7b5125aacd25086d510350a90a182e": "Rarible V2",
  // CEX addresses are defined in platforms.ts
  // Additional CEX addresses
  "0x81701e60a8e783aecf4dd5e5c9eb76f70a4431bb7441309dc3c6099f2c9e63d5": "Binance.us 1",
  "0xfd9192f8ad8dc60c483a884f0fbc8940f5b8618f3cf2bbf91693982b373dfdea": "Bitfinex 1",
  "0xe8ca094fec460329aaccc2a644dc73c5e39f1a2ad6e97f82b6cbdc1a5949b9ea": "MEXC 1",
  "0xde084991b91637a08e4da2f1b398f5f935e1393b65d13cc99c597ec5dc105b6b": "Crypto.com 1",
};
