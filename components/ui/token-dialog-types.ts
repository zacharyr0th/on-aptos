export interface TokenMetadata {
  name: string;
  symbol: string;
  thumbnail: string;
  type: string;
  issuer: string;
  assetAddress: string;
  decimals: number;
  explorerLink: string;
  website: string;
  auditLink: string;
  tags: string[];
}

export interface BaseTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: TokenMetadata;
  supply: string;
}

export interface SupplyItem {
  symbol: string;
  supply: string;
}
