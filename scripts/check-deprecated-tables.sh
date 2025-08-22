#!/bin/bash

# Script to check for deprecated Aptos indexer tables
# Usage: ./scripts/check-deprecated-tables.sh

echo "🔍 Checking for deprecated Aptos indexer tables..."

# Define deprecated tables based on Aptos documentation
# Only including tables that are explicitly listed as deprecated
DEPRECATED_TABLES=(
  "coin_activities("
  "coin_balances("
  "coin_infos("
  "coin_supply("
  "collection_datas("
  "current_ans_lookup("
  "current_coin_balances("
  "current_collection_datas("
  "current_delegated_staking_pool_balances("
  "current_staking_pool_voter("
  "current_table_items("
  "current_token_datas("
  "current_token_ownerships("
  "current_token_pending_claims("
  "delegated_staking_activities("
  "delegated_staking_pool_balances("
  "delegated_staking_pools("
  "indexer_status("
  "legacy_migration_v1("
  "move_resources("
  "nft_marketplace_v2("
  "num_active_delegator_per_pool("
  "processor_status("
  "proposal_votes("
  "staking_pool_voter("
  "table_items("
  "table_metadatas("
  "token_activities("
  "token_datas("
  "token_ownerships("
  "write_set_changes("
)

EXIT_CODE=0

# Check each deprecated table
for table in "${DEPRECATED_TABLES[@]}"; do
  echo "Checking for: $table"
  
  # Search for the deprecated table in relevant files
  if grep -r "$table" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=build \
    . ; then
    
    echo "❌ DEPRECATED TABLE FOUND: $table"
    EXIT_CODE=1
  fi
done

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No deprecated tables found!"
  echo "All Aptos indexer table usage is up to date!"
else
  echo ""
  echo "📚 Common replacements:"
  echo "  coin_activities → fungible_asset_activities"
  echo "  coin_balances → current_fungible_asset_balances"
  echo "  current_token_ownerships → current_token_ownerships_v2"
  echo "  token_activities → token_activities_v2"
  echo "  current_token_datas → current_token_datas_v2"
  echo "  current_collection_datas → current_collection_datas_v2"
  echo "  token_datas → token_datas_v2"
  echo "  token_ownerships → current_token_ownerships_v2"
  echo "  collection_datas → current_collection_datas_v2"
  echo ""
  echo "For full migration guide and all replacements, see:"
  echo "https://aptos.dev/en/build/indexer/indexer-api/indexer-reference"
fi

exit $EXIT_CODE