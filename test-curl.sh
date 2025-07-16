#!/bin/bash
echo "Testing RWA API..."
curl -s -X GET "http://localhost:3001/api/rwa" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | cat