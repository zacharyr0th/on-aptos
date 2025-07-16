#!/bin/bash
echo "Testing LST API endpoint..."
echo "================================"

# Test the LST API
echo -e "\n1. Testing LST API at http://localhost:3001/api/aptos/lst"
curl -s -X GET "http://localhost:3001/api/aptos/lst" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n================================"
echo "Testing direct Aptos Indexer query..."
echo "================================"

# Test direct GraphQL query to Aptos Indexer
echo -e "\n2. Testing Aptos Indexer directly"

# Test with amAPT token
curl -s -X POST "https://indexer.mainnet.aptoslabs.com/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query TokenMetadata($type: String!) { fungible_asset_metadata(where: { asset_type: { _eq: $type } }) { asset_type name symbol decimals } current_fungible_asset_balances_aggregate(where: { asset_type: { _eq: $type } }) { aggregate { sum { amount } count } } }",
    "variables": {
      "type": "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt"
    }
  }' | jq '.'

echo -e "\n================================"
echo "Done testing"