#!/bin/bash
echo "Testing LST API endpoint..."
echo "============================="

# Test the LST API
curl -s -X GET "http://localhost:3001/api/aptos/lst" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ API Response received')
    print('📊 Data structure:')
    if 'data' in data:
        inner_data = data['data']
        print(f'  - Total: {inner_data.get(\"total_formatted\", \"N/A\")}')
        print(f'  - Supplies count: {len(inner_data.get(\"supplies\", []))}')
        print('  - Tokens:')
        for supply in inner_data.get('supplies', []):
            print(f'    • {supply.get(\"symbol\", \"Unknown\")}: {supply.get(\"formatted_supply\", \"0\")}')
    else:
        print('  - No data field found')
        print(f'  - Keys: {list(data.keys())}')
except Exception as e:
    print(f'❌ Error parsing response: {e}')
    sys.stdin.seek(0)
    print('Raw response:')
    print(sys.stdin.read())
"

echo ""
echo "============================="
echo "Done"