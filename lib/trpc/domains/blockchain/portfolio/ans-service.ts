import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { logger } from '@/lib/utils/logger';

/**
 * ANS (Aptos Name Service) integration service
 * Provides functionality to resolve addresses to names and vice versa
 */
class ANSService {
  private aptos: Aptos;

  constructor() {
    const config = new AptosConfig({ 
      network: Network.MAINNET 
    });
    this.aptos = new Aptos(config);
  }

  /**
   * Get the primary ANS name for a given wallet address
   * @param address - The wallet address to lookup
   * @returns Promise resolving to the primary name or null if none exists
   */
  async getPrimaryName(address: string): Promise<string | null> {
    try {
      logger.info(`ANS: Getting primary name for address ${address}`);
      
      const primaryName = await this.aptos.getPrimaryName({
        address: address as `0x${string}`
      });

      if (primaryName) {
        logger.info(`ANS: Found primary name ${primaryName} for address ${address}`);
        return primaryName;
      }

      logger.info(`ANS: No primary name found for address ${address}`);
      return null;
    } catch (error) {
      logger.error(`ANS: Error getting primary name for ${address}:`, error);
      return null;
    }
  }

  /**
   * Get all ANS names (domains and subdomains) for a given wallet address
   * @param address - The wallet address to lookup
   * @returns Promise resolving to array of names
   */
  async getAccountNames(address: string): Promise<string[]> {
    try {
      logger.info(`ANS: Getting all names for address ${address}`);
      
      const names = await this.aptos.getAccountNames({
        accountAddress: address as `0x${string}`
      });

      const nameList = names
        .filter(name => name.domain && !name.subdomain)
        .map(name => `${name.domain}.apt`)
        .concat(
          names
            .filter(name => name.subdomain && name.domain)
            .map(name => `${name.subdomain}.${name.domain}.apt`)
        );

      logger.info(`ANS: Found ${nameList.length} names for address ${address}`);
      return nameList;
    } catch (error) {
      logger.error(`ANS: Error getting account names for ${address}:`, error);
      return [];
    }
  }

  /**
   * Get all ANS domains (excluding subdomains) for a given wallet address
   * @param address - The wallet address to lookup
   * @returns Promise resolving to array of domain names
   */
  async getAccountDomains(address: string): Promise<string[]> {
    try {
      logger.info(`ANS: Getting domains for address ${address}`);
      
      const domains = await this.aptos.getAccountDomains({
        accountAddress: address as `0x${string}`
      });

      const domainList = domains
        .filter(domain => domain.domain)
        .map(domain => `${domain.domain}.apt`);

      logger.info(`ANS: Found ${domainList.length} domains for address ${address}`);
      return domainList;
    } catch (error) {
      logger.error(`ANS: Error getting account domains for ${address}:`, error);
      return [];
    }
  }

  /**
   * Resolve an ANS name to its target address
   * @param name - The ANS name to resolve (with or without .apt suffix)
   * @returns Promise resolving to the target address or null if not found
   */
  async resolveNameToAddress(name: string): Promise<string | null> {
    try {
      // Ensure name has .apt suffix
      const normalizedName = name.endsWith('.apt') ? name : `${name}.apt`;
      
      logger.info(`ANS: Resolving name ${normalizedName} to address`);
      
      const address = await this.aptos.getOwnerAddress({
        name: normalizedName
      });

      if (address) {
        const addressString = address.toString();
        logger.info(`ANS: Resolved ${normalizedName} to address ${addressString}`);
        return addressString;
      }

      logger.info(`ANS: Could not resolve name ${normalizedName}`);
      return null;
    } catch (error) {
      logger.error(`ANS: Error resolving name ${name}:`, error);
      return null;
    }
  }

  /**
   * Get detailed information about an ANS name
   * @param name - The ANS name to lookup
   * @returns Promise resolving to name details or null if not found
   */
  async getNameDetails(name: string) {
    try {
      // Ensure name has .apt suffix
      const normalizedName = name.endsWith('.apt') ? name : `${name}.apt`;
      
      logger.info(`ANS: Getting details for name ${normalizedName}`);
      
      const nameInfo = await this.aptos.getName({
        name: normalizedName
      });

      if (nameInfo) {
        logger.info(`ANS: Found details for name ${normalizedName}`);
        return {
          domain: nameInfo.domain,
          subdomain: nameInfo.subdomain,
          ownerAddress: nameInfo.owner_address,
          registeredAddress: nameInfo.registered_address,
          isPrimary: nameInfo.is_primary,
          expirationTimestamp: nameInfo.expiration_timestamp,
          tokenStandard: nameInfo.token_standard
        };
      }

      logger.info(`ANS: No details found for name ${normalizedName}`);
      return null;
    } catch (error) {
      logger.error(`ANS: Error getting name details for ${name}:`, error);
      return null;
    }
  }

  /**
   * Check if a given string is a valid ANS name format
   * @param name - The string to validate
   * @returns boolean indicating if the name is valid ANS format
   */
  isValidANSName(name: string): boolean {
    // Basic ANS name validation
    const ansNameRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.apt$/i;
    const nameWithSuffix = name.endsWith('.apt') ? name : `${name}.apt`;
    return ansNameRegex.test(nameWithSuffix);
  }

  /**
   * Format an address for display, using ANS name if available
   * @param address - The address to format
   * @returns Promise resolving to formatted display string
   */
  async formatAddressForDisplay(address: string): Promise<string> {
    try {
      const primaryName = await this.getPrimaryName(address);
      if (primaryName) {
        return primaryName;
      }
      
      // Fallback to shortened address format
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    } catch (error) {
      logger.error(`ANS: Error formatting address ${address}:`, error);
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  }
}

// Export a singleton instance
export const ansService = new ANSService();
export default ansService;