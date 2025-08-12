import { logger } from "@/lib/utils/core/logger";

interface AnsResolveResult {
  address: string | null;
  domain: string;
  subdomain: string | null;
  source: "ans-api" | "graphql";
}

export class AnsService {
  private static readonly ANS_API_BASE =
    "https://www.aptosnames.com/api/mainnet/v1";
  private static readonly GRAPHQL_URL =
    "https://indexer.mainnet.aptoslabs.com/v1/graphql";
  private static readonly TIMEOUT = 5000;

  /**
   * Resolve a .apt domain name to an address
   * @param domain - The domain name (e.g., "zachtos.apt" or "sub.domain.apt")
   * @returns The resolved address or null if not found
   */
  static async resolveName(domain: string): Promise<AnsResolveResult> {
    // Clean the domain name
    const cleanDomain = domain.toLowerCase().trim();

    // Check if it's a valid .apt domain
    if (!cleanDomain.endsWith(".apt")) {
      logger.warn(`[ANS] Invalid domain format: ${domain}`);
      return {
        address: null,
        domain: cleanDomain,
        subdomain: null,
        source: "ans-api",
      };
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
        ? `${this.ANS_API_BASE}/address/${subdomain}.${domainName}`
        : `${this.ANS_API_BASE}/address/${domainName}`;

      logger.info(`[ANS] Resolving ${cleanDomain} via ANS API`);

      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "On-Aptos/1.0",
        },
        signal: AbortSignal.timeout(this.TIMEOUT),
      });

      if (response.ok) {
        const data = await response.json();
        logger.info(`[ANS] API response for ${cleanDomain}:`, data);

        // ANS API returns { address: "0x..." } for valid domains
        // Empty object {} means domain doesn't exist
        if (data?.address) {
          logger.info(
            `[ANS] Resolved ${cleanDomain} to ${data.address} via ANS API`,
          );
          return {
            address: data.address,
            domain: domainName,
            subdomain,
            source: "ans-api",
          };
        }

        // If no address in response or empty object, domain doesn't exist
        logger.info(`[ANS] Domain ${cleanDomain} not found in ANS registry`);
      }
    } catch (error) {
      logger.warn(
        `[ANS] ANS API failed for ${cleanDomain}, falling back to GraphQL:`,
        error,
      );
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

      const response = await fetch(this.GRAPHQL_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          variables: subdomain
            ? { domain: domainName, subdomain }
            : { domain: domainName },
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
          logger.info(
            `[ANS] Domain ${cleanDomain} exists but is not active (likely expired)`,
          );
          return {
            address: null,
            domain: domainName,
            subdomain,
            source: "graphql",
          };
        }

        // Also check expiration timestamp
        if (nameRecord.expiration_timestamp) {
          const expiration = new Date(
            nameRecord.expiration_timestamp,
          ).getTime();
          const now = Date.now();
          if (expiration < now) {
            logger.info(
              `[ANS] Domain ${cleanDomain} has expired on ${nameRecord.expiration_timestamp}`,
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
          `[ANS] Resolved ${cleanDomain} to ${nameRecord.registered_address} via GraphQL`,
        );
        return {
          address: nameRecord.registered_address,
          domain: domainName,
          subdomain,
          source: "graphql",
        };
      }
    } catch (error) {
      logger.error(`[ANS] GraphQL failed for ${cleanDomain}:`, error);
    }

    logger.info(`[ANS] Could not resolve ${cleanDomain}`);
    return { address: null, domain: domainName, subdomain, source: "graphql" };
  }

  /**
   * Check if a string is a valid .apt domain
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
  static parseDomain(
    domain: string,
  ): { domain: string; subdomain: string | null } | null {
    if (!this.isAptDomain(domain)) return null;

    const withoutSuffix = domain.toLowerCase().trim().slice(0, -4);
    const parts = withoutSuffix.split(".");

    return {
      domain: parts[parts.length - 1],
      subdomain: parts.length > 1 ? parts.slice(0, -1).join(".") : null,
    };
  }
}
