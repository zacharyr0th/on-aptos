#!/bin/bash

# CI Test Script - Test if code will pass GitHub CI locally
# Usage: ./scripts/ci-test.sh

set -e  # Exit on any error

echo "🧪 Testing CI pipeline locally..."
echo "================================="
echo "This script simulates the exact checks that run in GitHub CI"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=()

# Function to run a check and track results
run_ci_check() {
  local name="$1"
  local command="$2"
  local required="${3:-true}" # Default to required
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  echo ""
  echo -e "${BLUE}🔍 $name${NC}"
  echo "----------------------------------------"
  
  if eval "$command" > /tmp/ci_check.log 2>&1; then
    echo -e "${GREEN}✅ $name: PASSED${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    # Show last few lines of output for context
    if [ -s /tmp/ci_check.log ]; then
      tail -3 /tmp/ci_check.log | sed 's/^/   /'
    fi
  else
    echo -e "${RED}❌ $name: FAILED${NC}"
    FAILED_CHECKS+=("$name")
    # Show error output
    if [ -s /tmp/ci_check.log ]; then
      echo -e "${YELLOW}Error output:${NC}"
      cat /tmp/ci_check.log | head -20 | sed 's/^/   /'
      if [ $(wc -l < /tmp/ci_check.log) -gt 20 ]; then
        echo "   ... (output truncated, see full error above)"
      fi
    fi
    
    if [ "$required" = "true" ]; then
      echo -e "${RED}   This is a required check that will fail CI${NC}"
    else
      echo -e "${YELLOW}   This is an optional check${NC}"
    fi
  fi
  
  rm -f /tmp/ci_check.log
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Not in a Node.js project directory${NC}"
  echo "Please run this script from the project root"
  exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  Node modules not found. Installing dependencies...${NC}"
  pnpm install --frozen-lockfile
fi

echo -e "${BLUE}📦 Environment Setup${NC}"
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "TypeScript version: $(pnpm exec tsc --version 2>/dev/null || echo 'Not found')"
echo ""

# ==========================================
# CORE CI CHECKS (exact same as GitHub CI)
# ==========================================

run_ci_check "TypeScript Type Check" "pnpm exec tsc --noEmit"

run_ci_check "Lint Check" "pnpm run lint"

run_ci_check "Build Check" "pnpm run build"

# Console statements check (exact same logic as CI)
run_ci_check "Console Statements Check" '
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
  echo "Console statements found in source code!"
  exit 1
else
  echo "No console statements found"
  exit 0
fi'

# Secrets detection (simplified version of CI logic)
run_ci_check "Secrets Detection" '
SECRET_PATTERNS=(
  "api[_-]?key[s]?[[:space:]]*[:=][[:space:]]*[\"'"'"'][a-zA-Z0-9_-]{20,}[\"'"'"']"
  "secret[_-]?key[s]?[[:space:]]*[:=][[:space:]]*[\"'"'"'][a-zA-Z0-9_-]{20,}[\"'"'"']"
  "sk-[a-zA-Z0-9]{48}"
  "AKIA[0-9A-Z]{16}"
  "ghp_[A-Za-z0-9_]{36}"
  "-----BEGIN[[:space:]]+.*PRIVATE[[:space:]]+KEY-----"
  "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
  "(postgres|mysql|mongodb)://[^[:space:]]*:[^[:space:]]*@"
  "(PASSWORD|SECRET|KEY)[[:space:]]*[:=][[:space:]]*[\"'"'"'][^\"'"'"']{20,}[\"'"'"']"
)

EXIT_CODE=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  if grep -rE "$pattern" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.json" \
    --include="*.env*" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=.git \
    --exclude-dir=.vercel \
    --exclude="package-lock.json" \
    --exclude="pnpm-lock.yaml" \
    --exclude="*.yml" \
    --exclude="*.yaml" \
    . 2>/dev/null; then
    EXIT_CODE=1
    break
  fi
done

# Check for sensitive files
SENSITIVE_FILES=(".env" ".env.local" ".env.production" "*.pem" "*.key" "credentials.json")
for file_pattern in "${SENSITIVE_FILES[@]}"; do
  if find . -name "$file_pattern" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
    EXIT_CODE=1
    echo "Sensitive file found: $file_pattern"
    break
  fi
done

if [ $EXIT_CODE -eq 0 ]; then
  echo "No secrets detected"
else
  echo "Potential secrets or sensitive files detected"
fi
exit $EXIT_CODE'

# Deprecated tables check (exact same logic as CI)
run_ci_check "Deprecated Aptos Tables Check" '
DEPRECATED_TABLES=(
  "coin_activities(" "coin_balances(" "coin_infos(" "coin_supply("
  "collection_datas(" "current_ans_lookup(" "current_coin_balances("
  "current_collection_datas(" "current_delegated_staking_pool_balances("
  "current_staking_pool_voter(" "current_table_items(" "current_token_datas("
  "current_token_ownerships(" "current_token_pending_claims("
  "delegated_staking_activities(" "delegated_staking_pool_balances("
  "delegated_staking_pools(" "indexer_status(" "legacy_migration_v1("
  "move_resources(" "nft_marketplace_v2(" "num_active_delegator_per_pool("
  "processor_status(" "proposal_votes(" "staking_pool_voter("
  "table_items(" "table_metadatas(" "token_activities("
  "token_datas(" "token_ownerships(" "write_set_changes("
)

EXIT_CODE=0
for table in "${DEPRECATED_TABLES[@]}"; do
  if grep -r "$table" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=.git \
    . > /dev/null 2>&1; then
    echo "Deprecated table found: $table"
    EXIT_CODE=1
    break
  fi
done

if [ $EXIT_CODE -eq 0 ]; then
  echo "No deprecated tables found"
else
  echo "Deprecated Aptos indexer tables detected"
fi
exit $EXIT_CODE'

# Tests (optional since not all projects have tests)
if grep -q '"test"' package.json 2>/dev/null; then
  run_ci_check "Tests" "pnpm test" "false"
else
  echo ""
  echo -e "${YELLOW}⏭️  Tests: SKIPPED (no test script found in package.json)${NC}"
fi

# ==========================================
# SUMMARY
# ==========================================

echo ""
echo "========================================="
echo -e "${BLUE}📊 CI Test Results Summary${NC}"
echo "========================================="

if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CHECKS PASSED! ($PASSED_CHECKS/$TOTAL_CHECKS)${NC}"
  echo ""
  echo -e "${GREEN}✅ Your code will pass GitHub CI!${NC}"
  echo -e "${GREEN}✅ Safe to push to main/develop branches${NC}"
  echo -e "${GREEN}✅ Pull requests will be approved by CI${NC}"
  echo ""
  echo -e "${BLUE}🚀 Ready to deploy!${NC}"
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED ($((TOTAL_CHECKS - ${#FAILED_CHECKS[@]}))/$TOTAL_CHECKS passed)${NC}"
  echo ""
  echo -e "${RED}Failed checks:${NC}"
  for check in "${FAILED_CHECKS[@]}"; do
    echo -e "${RED}  • $check${NC}"
  done
  echo ""
  echo -e "${YELLOW}🛠️  Fix the issues above before pushing to GitHub${NC}"
  echo -e "${YELLOW}💡 Use individual check scripts for detailed debugging:${NC}"
  echo -e "${YELLOW}   ./scripts/check-console.sh${NC}"
  echo -e "${YELLOW}   ./scripts/check-secrets.sh${NC}"
  echo -e "${YELLOW}   ./scripts/check-deprecated-tables.sh${NC}"
  echo ""
  echo -e "${RED}🚫 GitHub CI will fail if you push now${NC}"
  exit 1
fi