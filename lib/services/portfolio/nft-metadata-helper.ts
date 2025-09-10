import { logger } from "@/lib/utils/core/logger";
import {
  extractIPFSHash,
  IPFS_GATEWAYS,
  resolveIPFSUrl,
} from "@/lib/utils/infrastructure/ipfs-gateway-fallback";

// Function to convert IPFS URL to HTTP URL
export async function convertIPFSToHTTP(url: string): Promise<string> {
  if (!url) return "";

  // Use the new fallback mechanism for IPFS URLs
  const resolvedUrl = await resolveIPFSUrl(url);

  // Handle Arweave protocol
  if (url.startsWith("ar://")) {
    const hash = url.replace("ar://", "");
    return `${ARWEAVE_GATEWAYS[0]}${hash}`;
  }

  return resolvedUrl;
}

// Synchronous version for immediate rendering (uses default gateway)
export function convertIPFSToHTTPSync(url: string): string {
  if (!url) return "";

  // Handle IPFS protocol
  if (url.startsWith("ipfs://")) {
    const hash = url.slice(7);
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // Handle Arweave protocol
  if (url.startsWith("ar://")) {
    const hash = url.replace("ar://", "");
    return `${ARWEAVE_GATEWAYS[0]}${hash}`;
  }

  // Extract IPFS hash from HTTP URLs and convert to preferred gateway
  const ipfsHash = extractIPFSHash(url);
  if (ipfsHash) {
    return `${IPFS_GATEWAYS[0]}${ipfsHash}`;
  }

  // Return as-is for other URLs
  return url;
}

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
    return await convertIPFSToHTTP(cdnImageUri);
  }

  if (!tokenUri) {
    return undefined;
  }

  try {
    // Convert IPFS/Arweave URLs to HTTP
    const httpUrl = await convertIPFSToHTTP(tokenUri);

    // Handle IPFS URIs - don't try to validate, just return converted URL
    if (tokenUri.startsWith("ipfs://")) {
      return httpUrl;
    }

    // Handle Arweave URIs
    if (tokenUri.startsWith("ar://")) {
      return httpUrl;
    }

    // Handle direct HTTP/HTTPS URLs
    if (httpUrl.startsWith("http://") || httpUrl.startsWith("https://")) {
      // If it's a JSON metadata URL, fetch and extract image
      if (httpUrl.endsWith(".json") || httpUrl.includes("/metadata/")) {
        try {
          const response = await fetch(httpUrl, {
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
          logger.debug(`Failed to fetch NFT metadata from ${httpUrl}:`, error);
        }
      }

      // Return as-is if it looks like an image URL
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
      if (imageExtensions.some((ext) => httpUrl.toLowerCase().includes(ext))) {
        return httpUrl;
      }

      // Otherwise return the URL and let the frontend handle it
      return httpUrl;
    }

    // Return converted URL if we can't process it
    return httpUrl;
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

  // For IPFS and Arweave URLs, we trust the gateway conversion
  if (tokenUri?.startsWith("ipfs://") || tokenUri?.startsWith("ar://")) {
    return imageUrl;
  }

  // Validate other URLs are safe
  if (!isSafeImageUrl(imageUrl)) {
    logger.debug(`Unsafe image URL blocked: ${imageUrl}`);
    return "/placeholder.jpg";
  }

  return imageUrl;
}
