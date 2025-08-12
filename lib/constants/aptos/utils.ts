/**
 * Utility functions for working with Aptos addresses
 * Moved from aptos-constants.ts
 */

/**
 * Utility functions for working with Aptos addresses
 */
export const AptosUtils = {
  /**
   * Check if address is a CEX
   */
  isCEXAddress: (
    address: string,
    cexAddresses: Record<string, readonly string[]>,
  ): boolean => {
    return Object.values(cexAddresses).some((addresses: readonly string[]) =>
      addresses.includes(address),
    );
  },

  /**
   * Check if address is an NFT platform
   */
  isNFTPlatform: (
    address: string,
    nftPlatforms: Record<string, string>,
  ): boolean => {
    return (Object.values(nftPlatforms) as readonly string[]).includes(address);
  },

  /**
   * Format address for display (short form)
   */
  formatAddress: (address: string, chars = 6): string => {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  },

  /**
   * Normalize address format
   */
  normalizeAddress: (address: string): string => {
    // Remove leading zeros and ensure 0x prefix
    const cleaned = address.replace(/^0x0+/, "0x") || "0x0";
    return cleaned === "0x" ? "0x0" : cleaned;
  },
} as const;
