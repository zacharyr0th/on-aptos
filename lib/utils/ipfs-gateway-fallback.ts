/**
 * IPFS gateway fallback utility
 */

export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.infura.io/ipfs/",
];

export function convertIpfsUrl(url: string): string {
  if (!url || !url.includes("ipfs://")) {
    return url;
  }

  const hash = url.replace("ipfs://", "");
  return `${IPFS_GATEWAYS[0]}${hash}`;
}

export function resolveIPFSUrl(url: string): string {
  return convertIpfsUrl(url);
}

export function extractIPFSHash(url: string): string {
  if (!url) return "";
  return url.replace("ipfs://", "").replace(/^\/ipfs\//, "");
}

export function getIpfsGateways(): string[] {
  return IPFS_GATEWAYS;
}
