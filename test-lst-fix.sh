#!/bin/bash

echo "Starting development server..."
pnpm dev &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 10

echo "Testing LST API..."
curl -s "http://localhost:3001/api/aptos/lst" | head -20

echo -e "\n\nKilling server..."
kill $SERVER_PID

echo "Test complete."