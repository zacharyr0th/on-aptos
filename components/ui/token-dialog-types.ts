/**
 * Shared types for token dialogs
 */

export interface TokenMetadata {
  symbol?: string;
  name?: string;
  decimals?: number;
  logoUrl?: string;
  description?: string;
  assetAddress?: string;
  issuer?: {
    name?: string;
    logo?: string;
    website?: string;
    twitter?: string;
  };
  tags?: string[];
  [key: string]: unknown;
}

export interface BaseTokenDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Current supply as string */
  supply: string;
  /** Token decimals */
  decimals: number;
  /** Token logo URL */
  logoUrl?: string;
  /** Token description */
  description?: string;
  /** Additional token metadata */
  metadata?: Record<string, unknown>;
}

export interface ExtendedTokenDialogProps extends BaseTokenDialogProps {
  /** Current price in USD */
  price?: number;
  /** 24h price change percentage */
  priceChange24h?: number;
  /** Market cap */
  marketCap?: string;
  /** Trading volume 24h */
  volume24h?: string;
}
