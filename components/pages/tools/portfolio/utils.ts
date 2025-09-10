import { defiProtocols } from "@/components/pages/protocols/defi/data";
import { normalizeProtocolName } from "@/lib/constants";
import { isPhantomAsset as isPhantomAssetFromRegistry } from "@/lib/constants/protocols/protocol-registry";

// Protocol name cleaning utility
export const cleanProtocolName = (name: string): string => {
  return name
    .replace(/\s+Finance$/i, "")
    .replace(/\s+Markets$/i, "")
    .trim();
};

// Import protocol logo mapping from centralized location
export { getProtocolLogo } from "@/lib/constants/protocols/protocol-logos";

// Import date formatting from centralized utilities
import { formatDate } from "@/lib/utils/format";

export const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return "Unknown";

  try {
    // Handle different timestamp formats
    let date: Date;
    if (timestamp.includes("-") || timestamp.includes("T")) {
      // ISO format timestamp
      date = new Date(timestamp);
    } else {
      // Unix timestamp (in microseconds for Aptos)
      const numTimestamp = Number(timestamp);
      if (isNaN(numTimestamp)) return "Invalid date";
      date = new Date(numTimestamp / 1000);
    }

    if (isNaN(date.getTime())) return "Invalid date";
    return formatDate(date, { format: "medium", includeTime: true });
  } catch (error) {
    return "Invalid date";
  }
};

// Use the centralized protocol registry for phantom asset detection and DeFi TVL filtering
export const isPhantomAsset = (assetType: string, metadata?: any): boolean => {
  return isPhantomAssetFromRegistry(assetType, metadata);
};

// Export copyToClipboard from centralized utility
export { copyToClipboard } from "@/lib/utils/clipboard";

// Helper function to get detailed protocol information
export const getDetailedProtocolInfo = (protocolName: string) => {
  const normalizedName = normalizeProtocolName(protocolName);
  return defiProtocols.find(
    (protocol) =>
      protocol.title === normalizedName ||
      protocol.title.toLowerCase() === protocolName.toLowerCase().trim() ||
      protocolName.toLowerCase().trim().includes(protocol.title.toLowerCase())
  );
};
