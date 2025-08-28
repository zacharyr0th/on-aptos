/**
 * Protocol Definitions Index
 *
 * Each protocol is in its own file for:
 * - Better organization
 * - Easier maintenance
 * - Code splitting
 * - Lazy loading capability
 */

// DEX Protocols
export { ThalaProtocol } from "./thala";
export { LiquidSwapProtocol } from "./liquidswap";
export { PancakeSwapProtocol } from "./pancakeswap";
export { SushiSwapProtocol } from "./sushiswap";
export { CellanaProtocol } from "./cellana";

// Lending Protocols
export { AriesProtocol } from "./aries";

// Liquid Staking Protocols
export { AmnisProtocol } from "./amnis";
export { ThalaLSDProtocol } from "./thala-lsd";

// Derivatives Protocols
export { MerkleProtocol } from "./merkle";

// Export all as array for bulk registration
export { getAllProtocols } from "./all";
