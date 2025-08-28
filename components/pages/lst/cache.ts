import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

// Create format cache for LST page
export const formatCache = new UnifiedCache<string>({
  ttl: 30 * 60 * 1000,
  maxSize: 2000,
}); // Cache for 30 min

// Preload common format values
formatCache.set("apt:0", "0 APT");
formatCache.set("apt:1", "1 APT");
formatCache.set("apt:100", "100 APT");
formatCache.set("apt:1000", "1,000 APT");
formatCache.set("apt:10000", "10,000 APT");
formatCache.set("apt:100000", "100,000 APT");
formatCache.set("apt:1000000", "1,000,000 APT");

formatCache.set("usd:0:1", "$0");
formatCache.set("usd:0:5", "$0");
formatCache.set("usd:0:10", "$0");

formatCache.set("supply:0:8", "0");
formatCache.set("supply:100000000:8", "1.00");

// Common percentage values
formatCache.set("percent:0", "0.0%");
formatCache.set("percent:100", "100.0%");
formatCache.set("percent:50", "50.0%");
formatCache.set("percent:25", "25.0%");
formatCache.set("percent:10", "10.0%");
