import { logger } from '@/lib/utils/logger';
import {
  isPhantomAsset as isPhantomAssetFromRegistry,
  getPhantomReason as getPhantomReasonFromRegistry,
  getProtocolByAddress,
  getAllProtocolAddresses,
} from '@/lib/protocol-registry';

export class PhantomAssetDetectionService {
  /**
   * Determine if an asset is likely a phantom asset (locked in protocol, not tradable)
   * Uses the centralized protocol registry
   */
  static isPhantomAsset(assetType: string, metadata?: any): boolean {
    return isPhantomAssetFromRegistry(assetType, metadata);
  }

  /**
   * Get reason why asset is considered phantom
   * Uses the centralized protocol registry
   */
  static getPhantomReason(assetType: string): string {
    return getPhantomReasonFromRegistry(assetType);
  }

  /**
   * Get all phantom assets from a list of assets
   */
  static getPhantomAssets(assets: any[]): any[] {
    return assets.filter(asset =>
      this.isPhantomAsset(asset.asset_type, asset.metadata)
    );
  }

  /**
   * Get all tradable assets from a list of assets
   */
  static getTradableAssets(assets: any[]): any[] {
    return assets.filter(
      asset => !this.isPhantomAsset(asset.asset_type, asset.metadata)
    );
  }

  /**
   * Log phantom asset detection for debugging
   */
  static logPhantomDetection(assetType: string, metadata?: any): void {
    const isPhantom = this.isPhantomAsset(assetType, metadata);
    if (isPhantom) {
      const reason = this.getPhantomReason(assetType);
      logger.info(
        `Phantom asset detected: ${metadata?.symbol || 'Unknown'} (${assetType}) - ${reason}`
      );
    }
  }

  /**
   * Check if asset originates from a known protocol address
   * Uses the centralized protocol registry
   */
  static isFromProtocolAddress(assetType: string): boolean {
    const allProtocolAddresses = getAllProtocolAddresses();
    return allProtocolAddresses.some(protocolAddress =>
      assetType.includes(protocolAddress)
    );
  }

  /**
   * Get protocol info for an asset
   * Uses the centralized protocol registry
   */
  static getProtocolInfo(assetType: string) {
    return getProtocolByAddress(assetType);
  }
}

// Export the class for backward compatibility (deprecated)
export const phantomDetector = PhantomAssetDetectionService;
