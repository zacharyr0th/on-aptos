import { logger } from "@/lib/utils/core/logger";

// Common IPFS gateways with fallback support - ordered by reliability
export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/", // Pinata last due to rate limiting
];

// Rate limiting tracker
const gatewayRateLimits = new Map<
  string,
  {
    failedAttempts: number;
    lastFailure: number;
    backoffUntil: number;
  }
>();

// Extract IPFS hash from various URL formats
export function extractIPFSHash(url: string): string | null {
  if (!url) return null;

  // Direct IPFS hash
  if (url.startsWith("ipfs://")) {
    return url.slice(7);
  }

  // HTTP gateway URLs - improved regex to capture full hash
  const gatewayPatterns = [
    /https?:\/\/[^/]+\/ipfs\/([a-zA-Z0-9]+[a-zA-Z0-9/\-_]*)/,
    /https?:\/\/[^/]+\.ipfs\.[^/]+\/([a-zA-Z0-9]+[a-zA-Z0-9/\-_]*)/,
  ];

  for (const pattern of gatewayPatterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Check if gateway is rate limited
function isGatewayRateLimited(gateway: string): boolean {
  const rateLimit = gatewayRateLimits.get(gateway);
  if (!rateLimit) return false;

  const now = Date.now();
  if (now < rateLimit.backoffUntil) {
    return true;
  }

  // Reset if backoff period has passed
  if (now - rateLimit.lastFailure > 60000) {
    // Reset after 1 minute
    gatewayRateLimits.delete(gateway);
    return false;
  }

  return false;
}

// Record gateway failure
function recordGatewayFailure(gateway: string, statusCode?: number) {
  const now = Date.now();
  const existing = gatewayRateLimits.get(gateway) || {
    failedAttempts: 0,
    lastFailure: now,
    backoffUntil: now,
  };

  existing.failedAttempts++;
  existing.lastFailure = now;

  // Exponential backoff for rate limiting (429) errors
  if (statusCode === 429) {
    const backoffSeconds = Math.min(60, 2 ** existing.failedAttempts);
    existing.backoffUntil = now + backoffSeconds * 1000;
    logger.debug(`Gateway ${gateway} rate limited, backing off for ${backoffSeconds}s`);
  } else {
    // Shorter backoff for other errors
    existing.backoffUntil = now + 5000;
  }

  gatewayRateLimits.set(gateway, existing);
}

// Test if a gateway is responsive
async function testGateway(gateway: string, hash: string): Promise<boolean> {
  // Skip if rate limited
  if (isGatewayRateLimited(gateway)) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${gateway}${hash}`, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      recordGatewayFailure(gateway, response.status);
      return false;
    }

    return true;
  } catch {
    recordGatewayFailure(gateway);
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
