#!/bin/bash

# Comprehensive quality check script for local development
# Usage: ./scripts/quality-check.sh

echo "🚀 Running comprehensive quality checks..."
echo "========================================"

EXIT_CODE=0

# Function to run a check and track results
run_check() {
  local name="$1"
  local command="$2"
  
  echo ""
  echo "🔍 $name..."
  echo "----------------------------------------"
  
  if eval "$command"; then
    echo "✅ $name: PASSED"
  else
    echo "❌ $name: FAILED"
    EXIT_CODE=1
  fi
}

# TypeScript type check
run_check "TypeScript Type Check" "pnpm exec tsc --noEmit"

# Linting
run_check "Lint Check" "pnpm run lint"

# Build check
run_check "Build Check" "pnpm run build"

# Console statements check
run_check "Console Statements Check" "./scripts/check-console.sh"

# Secrets detection
run_check "Secrets Detection" "./scripts/check-secrets.sh"

# Deprecated tables check
run_check "Deprecated Tables Check" "./scripts/check-deprecated-tables.sh"

# Tests (if they exist)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
  run_check "Tests" "pnpm test"
else
  echo ""
  echo "⏭️  Tests: SKIPPED (no test script found)"
fi

echo ""
echo "========================================"

if [ $EXIT_CODE -eq 0 ]; then
  echo "🎉 All quality checks passed!"
  echo "Your code is ready for commit! 🚀"
else
  echo "🚨 Some quality checks failed."
  echo "Please fix the issues above before committing."
fi

echo "========================================"
exit $EXIT_CODE