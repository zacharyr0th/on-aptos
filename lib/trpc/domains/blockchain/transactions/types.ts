export interface TransactionBase {
  version: string;
  hash: string;
  timestamp: string;
  success: boolean;
  vm_status?: string;
  gas_used?: string;
  gas_unit_price?: string;
  sender?: string;
  sequence_number?: string;
  max_gas_amount?: string;
  expiration_timestamp_secs?: string;
}

export interface CoinActivity {
  transaction_version: string;
  event_account_address: string;
  event_creation_number: string;
  event_sequence_number: string;
  owner_address: string;
  coin_type: string;
  amount: string;
  activity_type: string;
  is_gas_fee: boolean;
  is_transaction_success: boolean;
  transaction_timestamp: string;
  block_height: string;
  entry_function_id_str?: string;
  event_index?: string;
}

export interface FungibleAssetActivity {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  entry_function_id_str?: string;
  is_transaction_success: boolean;
  gas_fee_payer_address?: string;
  owner_address: string;
  storage_id?: string;
  token_standard?: string;
}

export interface TokenActivity {
  transaction_version: string;
  event_account_address: string;
  event_creation_number: string;
  event_sequence_number: string;
  collection_data_id_hash: string;
  token_data_id_hash: string;
  property_version: string;
  creator_address: string;
  collection_name: string;
  name: string;
  transfer_type: string;
  from_address?: string;
  to_address?: string;
  token_amount: string;
  transaction_timestamp: string;
  is_transaction_success: boolean;
}

export interface ProcessedTransaction {
  version: string;
  hash?: string;
  timestamp: string;
  type: TransactionType;
  category: TransactionCategory;
  success: boolean;
  amount?: string;
  currency?: string;
  asset_type?: string;
  from_address?: string;
  to_address?: string;
  gas_used?: string;
  gas_fee?: string;
  entry_function?: string;
  details?: Record<string, any>;
  events?: TransactionEvent[];
  changes?: TransactionChange[];
}

export interface TransactionEvent {
  type: string;
  data: Record<string, any>;
  sequence_number?: string;
  creation_number?: string;
}

export interface TransactionChange {
  type: string;
  address: string;
  data: Record<string, any>;
}

export type TransactionType =
  | 'coin_deposit'
  | 'coin_withdraw'
  | 'coin_transfer'
  | 'token_mint'
  | 'token_burn'
  | 'token_transfer'
  | 'token_swap'
  | 'nft_mint'
  | 'nft_transfer'
  | 'nft_burn'
  | 'smart_contract'
  | 'script'
  | 'module_publish'
  | 'state_checkpoint'
  | 'block_metadata'
  | 'user_transaction'
  | 'genesis'
  | 'unknown';

export type TransactionCategory =
  | 'transfer'
  | 'defi'
  | 'nft'
  | 'staking'
  | 'governance'
  | 'system'
  | 'other';

export interface TransactionFilter {
  types?: TransactionType[];
  categories?: TransactionCategory[];
  success?: boolean;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  verifiedOnly?: boolean;
}

export interface TransactionStats {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_gas_used: string;
  total_gas_fees: string;
  transaction_types: Record<TransactionType, number>;
  transaction_categories: Record<TransactionCategory, number>;
  date_range: {
    earliest: string;
    latest: string;
  };
}
