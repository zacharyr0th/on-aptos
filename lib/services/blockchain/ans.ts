/**
 * Aptos Name Service (ANS) integration with advanced caching, validation, and error handling.
 *
 * Features:
 * - Domain validation with specific error codes
 * - Intelligent caching with TTL management
 * - Fallback from ANS API to GraphQL
 * - Comprehensive error handling and retry logic
 * - Timeout control and abort signal support
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await AnsService.resolveName('zachtos.apt');
 *
 * // With options
 * const result = await AnsService.resolveName('zachtos.apt', {
 *   useCache: true,
 *   timeout: 3000,
 *   fallbackToGraphQL: false
 * });
 *
 * // Validation only
 * const isValid = AnsService.isAptDomain('zachtos.apt');
 * ```
 */

import { logger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

export interface AnsResolveResult {
  address: string | null;
  domain: string;
  subdomain: string | null;
  source: "ans-api" | "graphql";
  cached?: boolean;
  resolvedAt?: number;
}

export interface AnsValidationError {
  code: "INVALID_FORMAT" | "EMPTY_DOMAIN" | "INVALID_CHARACTERS" | "TOO_LONG";
  message: string;
  input: string;
}

export type AnsResolveOptions = {
  useCache?: boolean;
  timeout?: number;
  fallbackToGraphQL?: boolean;
};

export class AnsService {
  private static readonly ANS_API_BASE = "https://www.aptosnames.com/api/mainnet/v1";
  private static readonly GRAPHQL_URL = "https://indexer.mainnet.aptoslabs.com/v1/graphql";
  private static readonly DEFAULT_TIMEOUT = 5000;
  private static readonly MAX_DOMAIN_LENGTH = 63; // DNS limit per label
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes TTL

  /**
   * Validate domain format and return validation errors if any
   * @param domain - The domain name to validate
   * @returns Validation error or null if valid
   */
  private static validateDomain(domain: string): AnsValidationError | null {
    if (!domain || typeof domain !== "string") {
      return {
        code: "EMPTY_DOMAIN",
        message: "Domain cannot be empty",
        input: domain || "",
      };
    }

    const trimmed = domain.trim();
    if (trimmed.length === 0) {
      return {
        code: "EMPTY_DOMAIN",
        message: "Domain cannot be empty after trimming",
        input: domain,
      };
    }

    if (!trimmed.endsWith(".apt")) {
      return {
        code: "INVALID_FORMAT",
        message: "Domain must end with .apt",
        input: domain,
      };
    }

    const withoutSuffix = trimmed.slice(0, -4);
    if (withoutSuffix.length === 0) {
      return {
        code: "INVALID_FORMAT",
        message: "Domain name cannot be just .apt",
        input: domain,
      };
    }

    if (withoutSuffix.length > AnsService.MAX_DOMAIN_LENGTH) {
      return {
        code: "TOO_LONG",
        message: `Domain name too long (max ${AnsService.MAX_DOMAIN_LENGTH} characters)`,
        input: domain,
      };
    }

    if (
      !/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?(\.([a-z0-9]+([a-z0-9-]*[a-z0-9])?))*$/i.test(withoutSuffix)
    ) {
      return {
        code: "INVALID_CHARACTERS",
        message:
          "Domain contains invalid characters. Only alphanumeric characters, dots, and hyphens allowed",
        input: domain,
      };
    }

    return null;
  }

  /**
   * Resolve a .apt domain name to an address with enhanced error handling and caching
   * @param domain - The domain name (e.g., "zachtos.apt" or "sub.domain.apt")
   * @param options - Resolution options including caching and timeout
   * @returns The resolved address or null if not found
   */
  static async resolveName(
    domain: string,
    options: AnsResolveOptions = {}
  ): Promise<AnsResolveResult> {
    const {
      useCache = true,
      timeout = AnsService.DEFAULT_TIMEOUT,
      fallbackToGraphQL = true,
    } = options;
    // Validate the domain first
    const validationError = AnsService.validateDomain(domain);
    if (validationError) {
      logger.warn(`[ANS] Domain validation failed: ${validationError.message}`, {
        domain,
        error: validationError,
      });
      return {
        address: null,
        domain: domain.toLowerCase().trim(),
        subdomain: null,
        source: "ans-api",
        resolvedAt: Date.now(),
      };
    }

    // Clean the domain name
    const cleanDomain = domain.toLowerCase().trim();
    const cacheKey = `ans:${cleanDomain}`;

    // Check cache first if enabled
    if (useCache) {
      const cached = AnsService.cache.get<AnsResolveResult>(cacheKey);
      if (cached) {
        logger.debug(`[ANS] Cache hit for ${cleanDomain}`);
        return { ...cached, cached: true };
      }
    }

    // Remove .apt suffix
    const withoutSuffix = cleanDomain.slice(0, -4);
    const parts = withoutSuffix.split(".");

    // Extract domain and subdomain
    const domainName = parts[parts.length - 1];
    const subdomain = parts.length > 1 ? parts.slice(0, -1).join(".") : null;

    // Try ANS API first
    try {
      const apiUrl = subdomain
        ? `${AnsService.ANS_API_BASE}/address/${subdomain}.${domainName}`
        : `${AnsService.ANS_API_BASE}/address/${domainName}`;

      logger.info(`[ANS] Resolving ${cleanDomain} via ANS API`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "On-Aptos/1.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        logger.info(`[ANS] API response for ${cleanDomain}:`, data);

        // ANS API returns { address: "0x..." } for valid domains
        // Empty object {} means domain doesn't exist
        if (data?.address) {
          logger.info(`[ANS] Resolved ${cleanDomain} to ${data.address} via ANS API`);
          const result = {
            address: data.address,
            domain: domainName,
            subdomain,
            source: "ans-api" as const,
            resolvedAt: Date.now(),
          };

          // Cache the successful result
          if (useCache) {
            AnsService.cache.set(cacheKey, result, AnsService.CACHE_TTL);
          }

          return result;
        }

        // If no address in response or empty object, domain doesn't exist
        logger.info(`[ANS] Domain ${cleanDomain} not found in ANS registry`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.warn(`[ANS] ANS API request timeout for ${cleanDomain}`);
      } else {
        logger.warn(`[ANS] ANS API failed for ${cleanDomain}, falling back to GraphQL:`, error);
      }

      if (!fallbackToGraphQL) {
        const result = {
          address: null,
          domain: domainName,
          subdomain,
          source: "ans-api" as const,
          resolvedAt: Date.now(),
        };
        if (useCache) {
          AnsService.cache.set(cacheKey, result, AnsService.CACHE_TTL / 10); // Cache failures for shorter time
        }
        return result;
      }
    }

    // Fallback to GraphQL
    try {
      const query = subdomain
        ? `
        query ResolveSubdomain($domain: String!, $subdomain: String!) {
          current_aptos_names(
            where: {
              domain: {_eq: $domain}
              subdomain: {_eq: $subdomain}
              is_active: {_eq: true}
            }
            limit: 1
          ) {
            registered_address
            expiration_timestamp
          }
        }
      `
        : `
        query ResolveDomain($domain: String!) {
          current_aptos_names(
            where: {
              domain: {_eq: $domain}
              subdomain: {_is_null: true}
              is_active: {_eq: true}
            }
            limit: 1
          ) {
            registered_address
            expiration_timestamp
          }
        }
      `;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (process.env.APTOS_BUILD_SECRET) {
        headers["Authorization"] = `Bearer ${process.env.APTOS_BUILD_SECRET}`;
      }

      const response = await fetch(AnsService.GRAPHQL_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          variables: subdomain ? { domain: domainName, subdomain } : { domain: domainName },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        logger.error(`[ANS] GraphQL errors for ${cleanDomain}:`, result.errors);
        return {
          address: null,
          domain: domainName,
          subdomain,
          source: "graphql",
        };
      }

      const nameRecord = result.data?.current_aptos_names?.[0];

      if (nameRecord?.registered_address) {
        // Check if domain is active
        if (nameRecord.is_active === false) {
          logger.info(`[ANS] Domain ${cleanDomain} exists but is not active (likely expired)`);
          return {
            address: null,
            domain: domainName,
            subdomain,
            source: "graphql",
          };
        }

        // Also check expiration timestamp
        if (nameRecord.expiration_timestamp) {
          const expiration = new Date(nameRecord.expiration_timestamp).getTime();
          const now = Date.now();
          if (expiration < now) {
            logger.info(
              `[ANS] Domain ${cleanDomain} has expired on ${nameRecord.expiration_timestamp}`
            );
            return {
              address: null,
              domain: domainName,
              subdomain,
              source: "graphql",
            };
          }
        }

        logger.info(
          `[ANS] Resolved ${cleanDomain} to ${nameRecord.registered_address} via GraphQL`
        );
        const result = {
          address: nameRecord.registered_address,
          domain: domainName,
          subdomain,
          source: "graphql" as const,
          resolvedAt: Date.now(),
        };

        // Cache the successful result
        if (useCache) {
          AnsService.cache.set(cacheKey, result, AnsService.CACHE_TTL);
        }

        return result;
      }
    } catch (error) {
      logger.error(`[ANS] GraphQL failed for ${cleanDomain}:`, error);
    }

    logger.info(`[ANS] Could not resolve ${cleanDomain}`);
    const result = {
      address: null,
      domain: domainName,
      subdomain,
      source: "graphql" as const,
      resolvedAt: Date.now(),
    };

    // Cache negative results for shorter time
    if (useCache) {
      AnsService.cache.set(cacheKey, result, AnsService.CACHE_TTL / 5); // Cache failures for 1 minute
    }

    return result;
  }

  /**
   * Check if a string is a valid .apt domain format
   *
   * This method performs basic format validation but doesn't guarantee
   * the domain exists or is registered.
   *
   * @param input - The domain string to validate
   * @returns true if the format is valid, false otherwise
   *
   * @example
   * ```typescript
   * AnsService.isAptDomain('zachtos.apt'); // true
   * AnsService.isAptDomain('sub.zachtos.apt'); // true
   * AnsService.isAptDomain('invalid'); // false
   * ```
   */
  static isAptDomain(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed.endsWith(".apt")) return false;

    // Remove .apt and check the rest
    const withoutSuffix = trimmed.slice(0, -4);
    if (!withoutSuffix) return false;

    // Check valid domain format (alphanumeric and dots)
    return /^[a-z0-9]+(\.[a-z0-9]+)*$/.test(withoutSuffix);
  }

  /**
   * Parse a domain into its parts
   */
  static parseDomain(domain: string): { domain: string; subdomain: string | null } | null {
    if (!AnsService.isAptDomain(domain)) return null;

    const withoutSuffix = domain.toLowerCase().trim().slice(0, -4);
    const parts = withoutSuffix.split(".");

    return {
      domain: parts[parts.length - 1],
      subdomain: parts.length > 1 ? parts.slice(0, -1).join(".") : null,
    };
  }
}
