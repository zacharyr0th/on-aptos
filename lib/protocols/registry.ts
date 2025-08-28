/**
 * Protocol Registry - Central management system
 */

import { logger } from "@/lib/utils/core/logger";

import { ProtocolDefinition, ProtocolType } from "./types";

export class ProtocolRegistry {
  private static instance: ProtocolRegistry;
  private protocols = new Map<string, ProtocolDefinition>();
  private addressIndex = new Map<string, string>(); // address -> protocol id
  private typeIndex = new Map<ProtocolType, Set<string>>(); // type -> protocol ids
  private initialized = false;

  private constructor() {}

  static getInstance(): ProtocolRegistry {
    if (!this.instance) {
      this.instance = new ProtocolRegistry();
    }
    return this.instance;
  }

  /**
   * Register a protocol
   */
  register(protocol: ProtocolDefinition): void {
    const id = protocol.metadata.id;

    // Store protocol
    this.protocols.set(id, protocol);

    // Index by type
    if (!this.typeIndex.has(protocol.metadata.type)) {
      this.typeIndex.set(protocol.metadata.type, new Set());
    }
    this.typeIndex.get(protocol.metadata.type)!.add(id);

    // Index addresses (if not lazy loaded)
    if (Array.isArray(protocol.addresses)) {
      protocol.addresses.forEach((addr) => {
        this.addressIndex.set(addr.toLowerCase(), id);
      });
    }

    logger.debug(`Registered protocol: ${id}`, {
      type: protocol.metadata.type,
      addresses: Array.isArray(protocol.addresses)
        ? protocol.addresses.length
        : "lazy",
    });
  }

  /**
   * Register multiple protocols
   */
  registerBulk(protocols: ProtocolDefinition[]): void {
    protocols.forEach((p) => this.register(p));
  }

  /**
   * Get protocol by ID
   */
  get(id: string): ProtocolDefinition | undefined {
    return this.protocols.get(id);
  }

  /**
   * Get protocol by address
   */
  async getByAddress(address: string): Promise<ProtocolDefinition | undefined> {
    const normalized = address.toLowerCase();

    // Check index first
    const id = this.addressIndex.get(normalized);
    if (id) {
      return this.protocols.get(id);
    }

    // Check lazy-loaded addresses
    for (const [protocolId, protocol] of this.protocols) {
      if (typeof protocol.addresses === "function") {
        const addresses = await protocol.addresses();
        if (addresses.some((addr) => addr.toLowerCase() === normalized)) {
          // Cache for next time
          addresses.forEach((addr) => {
            this.addressIndex.set(addr.toLowerCase(), protocolId);
          });
          return protocol;
        }
      }
    }

    return undefined;
  }

  /**
   * Get protocols by type
   */
  getByType(type: ProtocolType): ProtocolDefinition[] {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids)
      .map((id) => this.protocols.get(id))
      .filter((p): p is ProtocolDefinition => p !== undefined);
  }

  /**
   * Search protocols
   */
  search(query: string): ProtocolDefinition[] {
    const q = query.toLowerCase();
    return Array.from(this.protocols.values()).filter(
      (p) =>
        p.metadata.name.toLowerCase().includes(q) ||
        p.metadata.displayName.toLowerCase().includes(q) ||
        p.metadata.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  /**
   * Get all protocols
   */
  getAll(): ProtocolDefinition[] {
    return Array.from(this.protocols.values());
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    audited: number;
    withPatterns: number;
  } {
    const protocols = this.getAll();
    const byType: Record<string, number> = {};

    for (const [type, ids] of this.typeIndex) {
      byType[type] = ids.size;
    }

    return {
      total: protocols.length,
      byType,
      audited: protocols.filter((p) => p.metadata.auditStatus === "audited")
        .length,
      withPatterns: protocols.filter((p) => p.patterns?.resources).length,
    };
  }

  /**
   * Clear registry (useful for testing)
   */
  clear(): void {
    this.protocols.clear();
    this.addressIndex.clear();
    this.typeIndex.clear();
    this.initialized = false;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Mark as initialized
   */
  setInitialized(): void {
    this.initialized = true;
  }
}

// Export singleton instance
export const protocolRegistry = ProtocolRegistry.getInstance();
