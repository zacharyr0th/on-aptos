#!/bin/bash

# Script to check for secrets and API keys in the codebase
# Usage: ./scripts/check-secrets.sh

echo "🔍 Scanning for secrets and API keys..."

# Define patterns for common secrets and API keys
SECRET_PATTERNS=(
  # Generic API keys
  "api[_-]?key[s]?[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9_-]{20,}['\"]"
  "secret[_-]?key[s]?[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9_-]{20,}['\"]"
  "access[_-]?token[s]?[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9_-]{20,}['\"]"
  
  # Exclude Aptos addresses which start with 0x and are 64+ chars
  # "['\"][a-zA-Z0-9_-]{32,}['\"]"
  "sk-[a-zA-Z0-9]{48}"
  "pk-[a-zA-Z0-9]{48}"
  
  # AWS
  "AKIA[0-9A-Z]{16}"
  "aws[_-]?secret[_-]?access[_-]?key"
  
  # Google Cloud
  "AIza[0-9A-Za-z_-]{35}"
  "ya29\.[0-9A-Za-z_-]+"
  
  # GitHub tokens
  "ghp_[A-Za-z0-9_]{36}"
  "gho_[A-Za-z0-9_]{36}"
  "ghu_[A-Za-z0-9_]{36}"
  "ghs_[A-Za-z0-9_]{36}"
  "ghr_[A-Za-z0-9_]{36}"
  
  # Private keys
  "-----BEGIN[[:space:]]+RSA[[:space:]]+PRIVATE[[:space:]]+KEY-----"
  "-----BEGIN[[:space:]]+PRIVATE[[:space:]]+KEY-----"
  "-----BEGIN[[:space:]]+OPENSSH[[:space:]]+PRIVATE[[:space:]]+KEY-----"
  
  # JWT tokens
  "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
  
  # Database URLs with passwords
  "postgres://[^[:space:]]*:[^[:space:]]*@"
  "mysql://[^[:space:]]*:[^[:space:]]*@"
  "mongodb://[^[:space:]]*:[^[:space:]]*@"
  
  # Slack tokens
  "xox[baprs]-[0-9a-zA-Z-]+"
  
  # Stripe keys
  "sk_live_[0-9a-zA-Z]{24}"
  "pk_live_[0-9a-zA-Z]{24}"
  "rk_live_[0-9a-zA-Z]{24}"
  
  # Common environment variable assignments with secrets (excluding error constants)
  "PASSWORD[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]"
  "SECRET[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]"
  # Exclude error message constants like INVALID_TOKEN
  # "TOKEN[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]"
  "KEY[[:space:]]*[:=][[:space:]]*['\"][^'\"]{20,}['\"]"
)

EXIT_CODE=0
FOUND_SECRETS=()

# Check each pattern
for pattern in "${SECRET_PATTERNS[@]}"; do
  echo "Checking pattern: ${pattern:0:50}..."
  
  # Search for the pattern in relevant files
  if grep -rE "$pattern" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.json" \
    --include="*.yaml" \
    --include="*.yml" \
    --include="*.env*" \
    --include="*.config.*" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=.git \
    --exclude="package-lock.json" \
    --exclude="pnpm-lock.yaml" \
    --exclude="yarn.lock" \
    --exclude-dir=".vercel" \
    --exclude="*.yml" \
    --exclude="*.yaml" \
    --exclude="check-secrets.sh" \
    --exclude="secrets-detection.yml" \
    . 2>/dev/null; then
    
    echo "❌ POTENTIAL SECRET FOUND with pattern: ${pattern:0:50}"
    FOUND_SECRETS+=("$pattern")
    EXIT_CODE=1
  fi
done

# Additional checks for specific files that shouldn't exist
SENSITIVE_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  "id_rsa"
  "id_dsa"
  "id_ecdsa"
  "id_ed25519"
  "*.pem"
  "*.key"
  "*.p12"
  "*.pfx"
  "credentials.json"
  "service-account.json"
)

echo ""
echo "🔍 Checking for sensitive files..."
for file_pattern in "${SENSITIVE_FILES[@]}"; do
  if find . -name "$file_pattern" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
    echo "❌ SENSITIVE FILE FOUND: $file_pattern"
    find . -name "$file_pattern" -not -path "./node_modules/*" -not -path "./.git/*"
    EXIT_CODE=1
  fi
done

# Check for hardcoded localhost with credentials
echo ""
echo "🔍 Checking for hardcoded credentials in URLs..."
if grep -rE "(http|https)://[^[:space:]]*:[^[:space:]]*@(localhost|127\.0\.0\.1)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  . 2>/dev/null; then
  echo "❌ HARDCODED CREDENTIALS IN URLs FOUND"
  EXIT_CODE=1
fi

# Check .gitignore coverage
echo ""
echo "🔍 Checking .gitignore for common secret patterns..."

REQUIRED_GITIGNORE_PATTERNS=(
  "\.env"
  "\.env\.local"
  "\.env\.production" 
  "\.env\.development"
  "\*\.pem"
  "\*\.key"
  "credentials\.json"
  "service-account\.json"
)

GITIGNORE_WARNINGS=0

if [ -f .gitignore ]; then
  for pattern in "${REQUIRED_GITIGNORE_PATTERNS[@]}"; do
    if ! grep -q "$pattern" .gitignore; then
      echo "⚠️  Consider adding '$pattern' to .gitignore"
      GITIGNORE_WARNINGS=1
    fi
  done
  
  if [ $GITIGNORE_WARNINGS -eq 0 ]; then
    echo "✅ .gitignore has good coverage for common secret files"
  fi
else
  echo "⚠️  No .gitignore file found - consider creating one"
fi

echo ""

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No secrets or API keys detected!"
  echo "🔒 Your code appears to be secure!"
else
  echo "❌ SECRETS OR API KEYS DETECTED!"
  echo ""
  echo "🛡️  Security Recommendations:"
  echo "  • Use environment variables for all secrets"
  echo "  • Add sensitive files to .gitignore"
  echo "  • Use .env.example files with placeholder values"
  echo "  • Never commit actual API keys, passwords, or tokens"
  echo "  • Use secret management services for production"
  echo ""
  echo "📝 Common fixes:"
  echo "  • Replace hardcoded values with process.env.VARIABLE_NAME"
  echo "  • Add secrets to your deployment environment"
  echo "  • Use tools like dotenv for local development"
  echo ""
  echo "If these are false positives (test data, examples), consider:"
  echo "  • Using placeholder values like 'your-api-key-here'"
  echo "  • Adding comments to explain test/example data"
  echo "  • Moving test data to separate test files"
  echo ""
  echo "🔑 Found patterns:"
  for secret in "${FOUND_SECRETS[@]}"; do
    echo "  - ${secret:0:50}"
  done
fi

exit $EXIT_CODE