#!/bin/bash

# Script to check for console statements in source code
# Usage: ./scripts/check-console.sh

echo "🔍 Checking for console statements in source code..."

if grep -r "console\." \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  app/ lib/ components/ 2>/dev/null; then
  
  echo ""
  echo "❌ Console statements found in source code!"
  echo ""
  echo "🛠️  Please use the logger from @/lib/utils/logger instead:"
  echo "  console.log() → logger.info()"
  echo "  console.error() → logger.error()"
  echo "  console.warn() → logger.warn()"
  echo "  console.debug() → logger.debug()"
  echo ""
  echo "Example:"
  echo "  import { logger } from '@/lib/utils/logger';"
  echo "  logger.info('User logged in', { userId: 123 });"
  
  exit 1
else
  echo "✅ No console statements found in source code!"
  exit 0
fi