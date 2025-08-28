/**
 * Protocol Detector - Smart detection and analysis
 */

import { logger } from "@/lib/utils/core/logger";

import { ProtocolLoader } from "./loader";
import { protocolRegistry } from "./registry";
import { ProtocolDefinition, ProtocolPattern, PositionType } from "./types";

export interface DetectionResult {
  protocol: ProtocolDefinition;
  confidence: number;
  positions: Array<{
    type: PositionType;
    assets: any[];
    metadata?: Record<string, any>;
  }>;
}

export class ProtocolDetector {
  private static cache = new Map<string, DetectionResult | null>();

  /**
   * Detect protocol from a resource
   */
  static async detectFromResource(
    resource: any,
  ): Promise<DetectionResult | null> {
    // Ensure protocols are loaded
    await ProtocolLoader.loadCore();

    const resourceType = resource.type;
    if (!resourceType) return null;

    // Check cache
    const cached = this.cache.get(resourceType);
    if (cached !== undefined) return cached;

    // Try address-based detection first
    const protocol = await this.detectByAddress(resourceType);
    if (protocol) {
      // Check if this protocol has patterns that match
      const result = await this.analyzeResourceWithProtocol(resource, protocol);
      if (result) {
        this.cache.set(resourceType, result);
        return result;
      }
    }

    // Try pattern-based detection across all protocols
    const patternResult = await this.detectByPattern(resource);
    this.cache.set(resourceType, patternResult);
    return patternResult;
  }

  /**
   * Detect protocol by address
   */
  private static async detectByAddress(
    resourceType: string,
  ): Promise<ProtocolDefinition | null> {
    // Extract address from resource type
    const addressMatch = resourceType.match(/0x[a-f0-9]+/i);
    if (!addressMatch) return null;

    const address = addressMatch[0];
    const protocol = await protocolRegistry.getByAddress(address);

    return protocol || null;
  }

  /**
   * Detect protocol by pattern matching
   */
  private static async detectByPattern(
    resource: any,
  ): Promise<DetectionResult | null> {
    const resourceType = resource.type;
    const protocols = protocolRegistry.getAll();

    let bestMatch: {
      protocol: ProtocolDefinition;
      pattern: ProtocolPattern;
      score: number;
    } | null = null;

    for (const protocol of protocols) {
      if (!protocol.patterns?.resources) continue;

      const patterns = Array.isArray(protocol.patterns.resources)
        ? protocol.patterns.resources
        : await protocol.patterns.resources();

      for (const pattern of patterns) {
        const score = this.scorePattern(resourceType, pattern);
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { protocol, pattern, score };
        }
      }
    }

    if (bestMatch) {
      const assets = bestMatch.pattern.extractAssets(resource.data);
      if (assets.length > 0) {
        return {
          protocol: bestMatch.protocol,
          confidence: Math.min(100, bestMatch.score),
          positions: [
            {
              type: bestMatch.pattern.positionType,
              assets,
              metadata: bestMatch.pattern.extractMetadata?.(resource.data),
            },
          ],
        };
      }
    }

    return null;
  }

  /**
   * Score a pattern match
   */
  private static scorePattern(
    resourceType: string,
    pattern: ProtocolPattern,
  ): number {
    const patternStr =
      typeof pattern.pattern === "string"
        ? pattern.pattern
        : pattern.pattern.source;
    const regex =
      typeof pattern.pattern === "string"
        ? new RegExp(pattern.pattern)
        : pattern.pattern;

    if (!regex.test(resourceType)) return 0;

    let score = pattern.priority || 50;

    // Bonus for exact matches
    if (resourceType === patternStr) {
      score += 50;
    }

    // Bonus for specific patterns
    if (
      patternStr.includes("::") &&
      resourceType.includes(patternStr.split("::")[1])
    ) {
      score += 20;
    }

    return score;
  }

  /**
   * Analyze resource with known protocol
   */
  private static async analyzeResourceWithProtocol(
    resource: any,
    protocol: ProtocolDefinition,
  ): Promise<DetectionResult | null> {
    if (!protocol.patterns?.resources) {
      return {
        protocol,
        confidence: 50, // Low confidence without patterns
        positions: [],
      };
    }

    const patterns = Array.isArray(protocol.patterns.resources)
      ? protocol.patterns.resources
      : await protocol.patterns.resources();

    const positions = [];
    let maxPriority = 0;

    for (const pattern of patterns) {
      const regex =
        typeof pattern.pattern === "string"
          ? new RegExp(pattern.pattern)
          : pattern.pattern;

      if (regex.test(resource.type)) {
        const assets = pattern.extractAssets(resource.data);
        if (assets.length > 0) {
          positions.push({
            type: pattern.positionType,
            assets,
            metadata: pattern.extractMetadata?.(resource.data),
          });
          maxPriority = Math.max(maxPriority, pattern.priority || 50);
        }
      }
    }

    if (positions.length === 0) return null;

    return {
      protocol,
      confidence: Math.min(100, 50 + maxPriority / 2),
      positions,
    };
  }

  /**
   * Detect protocol from transaction
   */
  static async detectFromTransaction(
    tx: any,
  ): Promise<ProtocolDefinition | null> {
    await ProtocolLoader.loadCore();

    if (!tx.type) return null;

    // Try direct address detection
    const protocol = await this.detectByAddress(tx.type);
    if (protocol) return protocol;

    // Try function-based detection
    const functionName = tx.function?.toLowerCase() || tx.type.toLowerCase();

    for (const protocol of protocolRegistry.getAll()) {
      if (!protocol.patterns?.transactions) continue;

      const patterns = Array.isArray(protocol.patterns.transactions)
        ? protocol.patterns.transactions
        : await protocol.patterns.transactions();

      for (const pattern of patterns) {
        const regex =
          typeof pattern.pattern === "string"
            ? new RegExp(pattern.pattern)
            : pattern.pattern;

        if (regex.test(functionName)) {
          return protocol;
        }
      }
    }

    return null;
  }

  /**
   * Batch detect from multiple resources
   */
  static async detectBatch(
    resources: any[],
  ): Promise<Map<string, DetectionResult>> {
    await ProtocolLoader.loadCore();

    const results = new Map<string, DetectionResult>();

    // Process in parallel for speed
    const detectionPromises = resources.map(async (resource) => {
      const result = await this.detectFromResource(resource);
      if (result) {
        results.set(resource.type, result);
      }
    });

    await Promise.all(detectionPromises);

    return results;
  }

  /**
   * Clear detection cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: 0, // Would need to track this
      misses: 0, // Would need to track this
    };
  }
}
