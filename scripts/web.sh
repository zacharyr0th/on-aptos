#!/bin/bash

# Kill any process running on port 3001
echo "🔪 Killing processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No processes found on port 3001"

# Wait a moment for cleanup
sleep 1

# Start bun dev on port 3001
echo "🚀 Starting bun dev on port 3001..."
bun run dev --port 3001