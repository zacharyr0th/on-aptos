export interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  property_version_v1: number;
  amount: number;
  cdn_image_uri?: string;
  cdn_animation_uri?: string;
  collection_description?: string;
  creator_address?: string;
  collection_uri?: string;
  last_transaction_version?: number;
  last_transaction_timestamp?: string;
}

export type SortField = 'timestamp' | 'type' | 'amount' | 'asset';
export type SortDirection = 'asc' | 'desc';
