#!/bin/bash

# Auto-fix common CI issues
# Usage: ./scripts/fix-common-issues.sh

echo "🔧 Auto-fixing common CI issues..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FIXES_APPLIED=0

echo ""
echo "🔍 Checking for auto-fixable issues..."

# 1. Auto-fix linting issues
echo ""
echo -e "${YELLOW}Attempting to auto-fix linting issues...${NC}"
if pnpm run lint -- --fix > /tmp/lint_fix.log 2>&1; then
  echo -e "${GREEN}✅ Linting auto-fixes applied${NC}"
  FIXES_APPLIED=$((FIXES_APPLIED + 1))
else
  echo "⚠️  Some linting issues require manual fixing"
  tail -5 /tmp/lint_fix.log
fi

# 2. Format code
if command -v prettier >/dev/null 2>&1 || pnpm list prettier >/dev/null 2>&1; then
  echo ""
  echo -e "${YELLOW}Running code formatter...${NC}"
  if pnpm exec prettier --write "**/*.{ts,tsx,js,jsx,json}" > /tmp/prettier.log 2>&1; then
    echo -e "${GREEN}✅ Code formatting applied${NC}"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
  else
    echo "⚠️  Code formatting had issues"
  fi
fi

# 3. Clean up common console statements
echo ""
echo -e "${YELLOW}Checking for easily replaceable console statements...${NC}"

CONSOLE_REPLACEMENTS=(
  "s/console\.info(/logger.info(/g"
  "s/console\.log(/logger.info(/g"
  "s/console\.warn(/logger.warn(/g"
  "s/console\.error(/logger.error(/g"
  "s/console\.debug(/logger.debug(/g"
)

CONSOLE_FILES_FIXED=0
for file in $(find app lib components -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules); do
  if grep -q "console\." "$file" 2>/dev/null; then
    # Check if logger is already imported
    if grep -q "from.*logger" "$file"; then
      # Apply replacements
      for replacement in "${CONSOLE_REPLACEMENTS[@]}"; do
        sed -i '' "$replacement" "$file"
      done
      CONSOLE_FILES_FIXED=$((CONSOLE_FILES_FIXED + 1))
    fi
  fi
done

if [ $CONSOLE_FILES_FIXED -gt 0 ]; then
  echo -e "${GREEN}✅ Fixed console statements in $CONSOLE_FILES_FIXED files${NC}"
  echo "   (Only in files that already import logger)"
  FIXES_APPLIED=$((FIXES_APPLIED + 1))
else
  echo "ℹ️  No auto-fixable console statements found"
fi

# 4. Remove unused imports (if supported)
echo ""
echo -e "${YELLOW}Organizing imports...${NC}"
if pnpm exec tsc --noEmit --skipLibCheck > /tmp/unused_imports.log 2>&1; then
  echo -e "${GREEN}✅ TypeScript compilation clean${NC}"
else
  echo "⚠️  Some TypeScript issues found (see ci-test.sh for details)"
fi

# Summary
echo ""
echo "=================================="
echo "🔧 Auto-fix Summary"
echo "=================================="

if [ $FIXES_APPLIED -gt 0 ]; then
  echo -e "${GREEN}✅ Applied $FIXES_APPLIED automatic fixes${NC}"
  echo ""
  echo "Recommended next steps:"
  echo "1. Review the changes: git diff"
  echo "2. Test locally: ./scripts/ci-test.sh"
  echo "3. Commit if everything looks good"
  echo ""
  echo -e "${YELLOW}Note: Some issues may still require manual fixing${NC}"
else
  echo "ℹ️  No automatic fixes were applied"
  echo "All issues require manual attention"
fi

echo ""
echo "Run './scripts/ci-test.sh' to check if issues are resolved"

# Clean up temp files
rm -f /tmp/lint_fix.log /tmp/prettier.log /tmp/unused_imports.log