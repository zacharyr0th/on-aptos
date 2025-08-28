/**
 * Export all protocol definitions
 */

import { ProtocolDefinition } from "../types";

// Import all protocol definitions
import { AmnisProtocol } from "./amnis";
import { AriesProtocol } from "./aries";
import { CellanaProtocol } from "./cellana";
import { LiquidSwapProtocol } from "./liquidswap";
import { MerkleProtocol } from "./merkle";
import { PancakeSwapProtocol } from "./pancakeswap";
import { SushiSwapProtocol } from "./sushiswap";
import { ThalaProtocol } from "./thala";
import { ThalaLSDProtocol } from "./thala-lsd";

/**
 * Get all protocol definitions
 */
export function getAllProtocols(): ProtocolDefinition[] {
  return [
    // DEX Protocols
    ThalaProtocol,
    LiquidSwapProtocol,
    PancakeSwapProtocol,
    SushiSwapProtocol,
    CellanaProtocol,

    // Lending Protocols
    AriesProtocol,

    // Liquid Staking Protocols
    AmnisProtocol,
    ThalaLSDProtocol,

    // Derivatives Protocols
    MerkleProtocol,
  ];
}
