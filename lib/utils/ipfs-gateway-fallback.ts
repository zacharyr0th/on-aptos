import { logger } from "@/lib/utils/logger";

// Common IPFS gateways with fallback support
export const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

// Extract IPFS hash from various URL formats
export function extractIPFSHash(url: string): string | null {
  if (!url) return null;

  // Direct IPFS hash
  if (url.startsWith("ipfs://")) {
    return url.slice(7);
  }

  // HTTP gateway URLs
  const gatewayPatterns = [
    /https?:\/\/[^\/]+\/ipfs\/([a-zA-Z0-9]+)/,
    /https?:\/\/[^\/]+\.ipfs\.[^\/]+\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of gatewayPatterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Test if a gateway is responsive
async function testGateway(gateway: string, hash: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${gateway}${hash}`, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Resolve IPFS URL with fallback support
export async function resolveIPFSUrl(url: string): Promise<string> {
  if (!url) return "";

  // Handle IPFS protocol
  if (url.startsWith("ipfs://")) {
    const hash = url.slice(7);

    // Try gateways in order
    for (const gateway of IPFS_GATEWAYS) {
      const fullUrl = `${gateway}${hash}`;
      const isResponsive = await testGateway(gateway, hash);

      if (isResponsive) {
        logger.debug(`IPFS gateway ${gateway} is responsive for hash ${hash}`);
        return fullUrl;
      }
    }

    // If all fail, return the first gateway URL anyway
    logger.warn(`All IPFS gateways failed for hash ${hash}, using default`);
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // Extract IPFS hash from existing gateway URLs and potentially switch gateways
  const ipfsHash = extractIPFSHash(url);
  if (ipfsHash) {
    // Try to use a better gateway
    for (const gateway of IPFS_GATEWAYS) {
      const fullUrl = `${gateway}${ipfsHash}`;
      const isResponsive = await testGateway(gateway, ipfsHash);

      if (isResponsive) {
        return fullUrl;
      }
    }
  }

  // Return as-is for non-IPFS URLs
  return url;
}
