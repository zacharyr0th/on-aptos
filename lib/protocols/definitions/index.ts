/**
 * Protocol Definitions Index
 *
 * Each protocol is in its own file for:
 * - Better organization
 * - Easier maintenance
 * - Code splitting
 * - Lazy loading capability
 */

// Export all as array for bulk registration
export { getAllProtocols } from "./all";
// Liquid Staking Protocols
export { AmnisProtocol } from "./amnis";
// Lending Protocols
export { AriesProtocol } from "./aries";
export { CellanaProtocol } from "./cellana";
export { LiquidSwapProtocol } from "./liquidswap";
// Derivatives Protocols
export { MerkleProtocol } from "./merkle";
export { PancakeSwapProtocol } from "./pancakeswap";
export { SushiSwapProtocol } from "./sushiswap";
// DEX Protocols
export { ThalaProtocol } from "./thala";
export { ThalaLSDProtocol } from "./thala-lsd";
