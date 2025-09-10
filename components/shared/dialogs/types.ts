import type { StaticImageData } from "next/image";
import type React from "react";

/**
 * Shared types for dialog components
 */

// Base dialog props
export interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Token metadata interface (generic for all token types)
export interface DialogTokenMetadata {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  thumbnail?: string | StaticImageData;
  logoUrl?: string;
  description?: string;
  type?: string;
  issuer?: string | { name?: string };
  website?: string;
  auditLink?: string;
  explorerLink?: string;
  tags?: string[];
  assetAddress?: string; // For backward compatibility
}

// Supply display props
export interface SupplyDisplayProps {
  supply: string;
  symbol: string;
  metadata: DialogTokenMetadata;
  formatOptions?: {
    showCurrency?: boolean;
    showConversion?: boolean;
    conversionRate?: number;
    conversionSymbol?: string;
  };
}

// Address display props
export interface AddressDisplayProps {
  addresses: string | string[];
  labels?: string[];
  onCopy?: (address: string, label?: string) => void;
  showExplorerLinks?: boolean;
  customActions?: {
    icon: React.ReactNode;
    onClick: (address: string) => void;
    tooltip?: string;
  }[];
}

// Section props for dialog content
export interface DialogSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Info row props for key-value pairs
export interface DialogInfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

// Token-specific dialog props
export interface TokenDialogBaseProps extends BaseDialogProps {
  metadata: DialogTokenMetadata;
  supply: string;
  onCopy?: (text: string, label?: string) => void;
}

// BTC dialog specific props
export interface BtcDialogProps extends TokenDialogBaseProps {
  bitcoinPrice?: number;
}

// Stables dialog specific props
export interface StablesDialogProps extends TokenDialogBaseProps {
  susdePrice?: number;
  suppliesData?: Record<string, string>;
}

// RWA dialog specific props
export interface RwaDialogProps extends BaseDialogProps {
  token: RWATokenData;
  currentValue?: number;
}

export interface RWATokenData {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  assetTicker: string;
  assetName: string;
  assetIssuer?: string;
  protocol: string;
  standards?: string;
  assetRegulatoryFramework?: string;
  assetGoverningBody?: string;
  assetIssuerLegalStructureCountry?: string;
}

// Yield dialog specific props
export interface YieldDialogProps extends BaseDialogProps {
  market: MarketData | null;
  protocol: string;
}

export interface MarketData {
  symbol: string;
  description: string;
  balance: string;
  price?: number;
  apyBase?: number;
  apyReward?: number;
  apyBaseBorrow?: number;
  totalSupply?: number;
  totalBorrow?: number;
  totalSupplyUsd?: number;
  totalBorrowUsd?: number;
  tvlUsd?: number;
}

// Dialog content type definitions
export type DialogContentType = "token" | "btc" | "stables" | "rwa" | "yield" | "custom";

// Theme and styling props
export interface DialogThemeProps {
  variant?: "default" | "compact" | "detailed";
  colorScheme?: "default" | "bitcoin" | "stablecoin" | "rwa" | "defi";
  showBackground?: boolean;
  customClassName?: string;
}

// Layout props for different dialog sizes and arrangements
export interface DialogLayoutProps {
  size?: "sm" | "md" | "lg" | "xl";
  layout?: "single-column" | "two-column" | "grid";
  responsive?: boolean;
  maxHeight?: string;
  scrollable?: boolean;
}

// Action button props for dialogs
export interface DialogActionProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

// Complete dialog props combining all aspects
export interface ComprehensiveDialogProps
  extends BaseDialogProps,
    DialogThemeProps,
    DialogLayoutProps {
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  actions?: DialogActionProps[];
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  contentType?: DialogContentType;
}

// Error handling for dialogs
export interface DialogErrorProps {
  error?: string | Error | null;
  onRetry?: () => void;
  fallbackComponent?: React.ComponentType<any>;
}

// Loading state for dialogs
export interface DialogLoadingProps {
  loading?: boolean;
  loadingMessage?: string;
  skeleton?: "table" | "cards" | "text" | "custom";
}

// Analytics/tracking props
export interface DialogAnalyticsProps {
  trackOpening?: boolean;
  trackInteractions?: boolean;
  dialogId?: string;
  category?: string;
}
