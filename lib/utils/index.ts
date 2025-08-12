// ===== CORE UTILITIES =====
// Re-export all core utilities
export * from "./core";

// ===== API UTILITIES =====
// Re-export all API utilities
export * from "./api";

// ===== CACHE UTILITIES =====
// Re-export all cache utilities
export * from "./cache";

// ===== FORMAT UTILITIES =====
// Re-export all format utilities
export * from "./format";

// ===== TOKEN UTILITIES =====
// Re-export all token utilities
export * from "./token";

// ===== INFRASTRUCTURE UTILITIES =====
// Re-export infrastructure utilities (selective export for client safety)
export { setupGracefulShutdown } from "./infrastructure/graceful-shutdown";
export { extractIPFSHash, resolveIPFSUrl, IPFS_GATEWAYS } from "./infrastructure/ipfs-gateway-fallback";
// sitemap is server-only, not exported here

// ===== SERVER-SIDE ONLY EXPORTS =====
// IMPORTANT: For server-only utilities, import from '@/lib/utils/server' instead
