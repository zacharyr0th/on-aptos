import { logger } from "@/lib/utils/core/logger";

// Common IPFS gateways
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.infura.io/ipfs/",
  "https://ipfs.4everland.io/ipfs/",
  "https://ipfs.filebase.io/ipfs/",
  "https://ipfs.w3s.link/ipfs/",
  "https://ipfs.dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
];

// Common Arweave gateways
const ARWEAVE_GATEWAYS = [
  "https://arweave.net/",
  "https://gateway.arweave.net/",
  "https://arweave.dev/",
  "https://ar-io.net/",
];

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: unknown;
  }>;
}

/**
 * Extract image URL from NFT metadata or token URI
 */
export async function extractNFTImageUrl(
  tokenUri: string | undefined,
  cdnImageUri: string | undefined
): Promise<string | undefined> {
  // Prefer CDN image if available
  if (cdnImageUri) {
    return cdnImageUri;
  }

  if (!tokenUri) {
    return undefined;
  }

  try {
    // Handle IPFS URIs
    if (tokenUri.startsWith("ipfs://")) {
      const ipfsHash = tokenUri.replace("ipfs://", "");
      // Try multiple gateways
      for (const gateway of IPFS_GATEWAYS) {
        try {
          const url = `${gateway}${ipfsHash}`;
          const response = await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            return url;
          }
        } catch {
          // Try next gateway
        }
      }
      // Default to first gateway if none work
      return `${IPFS_GATEWAYS[0]}${ipfsHash}`;
    }

    // Handle Arweave URIs
    if (tokenUri.startsWith("ar://")) {
      const arweaveId = tokenUri.replace("ar://", "");
      return `${ARWEAVE_GATEWAYS[0]}${arweaveId}`;
    }

    // Handle direct HTTP/HTTPS URLs
    if (tokenUri.startsWith("http://") || tokenUri.startsWith("https://")) {
      // If it's a JSON metadata URL, fetch and extract image
      if (tokenUri.endsWith(".json") || tokenUri.includes("/metadata/")) {
        try {
          const response = await fetch(tokenUri, {
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            const metadata: NFTMetadata = await response.json();
            if (metadata.image) {
              // Recursively handle the image URL (it might be IPFS)
              return extractNFTImageUrl(metadata.image, undefined);
            }
          }
        } catch (error) {
          logger.warn(`Failed to fetch NFT metadata from ${tokenUri}:`, error);
        }
      }

      // Return as-is if it looks like an image URL
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
      if (imageExtensions.some((ext) => tokenUri.toLowerCase().includes(ext))) {
        return tokenUri;
      }

      // Otherwise return the URL and let the frontend handle it
      return tokenUri;
    }

    // Return original if we can't process it
    return tokenUri;
  } catch (error) {
    logger.error("Error extracting NFT image URL:", error);
    return undefined;
  }
}

/**
 * Validate if a URL is from a safe domain
 */
export function isSafeImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Always allow HTTPS
    if (urlObj.protocol !== "https:") {
      return false;
    }

    // List of known safe domains (this should match next.config.mjs)
    const safeDomains = [
      "ipfs.io",
      "gateway.ipfs.io",
      "cloudflare-ipfs.com",
      "gateway.pinata.cloud",
      "arweave.net",
      "gateway.arweave.net",
      "nftstorage.link",
      "ipfs.infura.io",
      "ipfs.4everland.io",
      "ipfs.filebase.io",
      "ipfs.w3s.link",
      "ipfs.dweb.link",
      "imagedelivery.net",
      "cdn.discordapp.com",
      "media.discordapp.net",
      "storage.googleapis.com",
      "res.cloudinary.com",
      "s3.amazonaws.com",
      "digitaloceanspaces.com",
      "backblazeb2.com",
      "magiceden.dev",
      "bluemove.net",
      "aptoslabs.com",
      "cellana.finance",
      "aptosnames.com",
      "panora.exchange",
      "wav3.net",
      "aptos-monkeys.com",
      "aptomingos.com",
      "bruh-bears.com",
      "pontem.network",
      "topaz.so",
    ];

    // Check if hostname ends with any safe domain
    return safeDomains.some(
      (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Process NFT token URI to extract a usable image URL
 */
export async function processNFTTokenUri(
  tokenUri: string | undefined,
  cdnImageUri: string | undefined
): Promise<string> {
  const imageUrl = await extractNFTImageUrl(tokenUri, cdnImageUri);

  if (!imageUrl) {
    return "/placeholder.jpg";
  }

  // Validate the URL is safe
  if (!isSafeImageUrl(imageUrl)) {
    logger.warn(`Unsafe image URL blocked: ${imageUrl}`);
    return "/placeholder.jpg";
  }

  return imageUrl;
}

/**
 * Synchronously converts IPFS URLs to HTTP URLs
 * This is a simplified version for immediate UI rendering
 */
export function convertIPFSToHTTPSync(url: string | undefined): string {
  if (!url) {
    return "/placeholder.jpg";
  }

  // Convert IPFS URLs to HTTP URLs
  if (url.startsWith("ipfs://")) {
    const hash = url.replace("ipfs://", "");
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // Convert Arweave URLs
  if (url.startsWith("ar://")) {
    const hash = url.replace("ar://", "");
    return `${ARWEAVE_GATEWAYS[0]}${hash}`;
  }

  // Return as-is if already HTTP(S)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // For relative paths or other protocols, return placeholder
  return "/placeholder.jpg";
}
