# 🔐 Security Setup Guide

This guide will help you set up the complete security workflow for the On Aptos repository.

## 🚀 Quick Setup

### 1. Install Pre-commit Hooks

```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Install the git hook scripts
pre-commit install

# Install commit message hook
pre-commit install --hook-type commit-msg

# Test the hooks
pre-commit run --all-files
```

### 2. Generate Secrets Baseline

```bash
# Install detect-secrets
pip install detect-secrets

# Update the baseline (this scans for existing secrets and marks them as known)
detect-secrets scan --baseline .secrets.baseline --update
```

### 3. Install Gitleaks (Optional - for local testing)

```bash
# macOS
brew install gitleaks

# Linux (using curl)
curl -sSfL https://raw.githubusercontent.com/zricethezav/gitleaks/master/scripts/install.sh | sh -s -- -b /usr/local/bin

# Test gitleaks locally
gitleaks detect --source . --config .gitleaks.toml
```

## 📋 Security Layers Overview

### Layer 1: Pre-commit Hooks (Local Protection)
- **Gitleaks**: Detects secrets before commit
- **detect-secrets**: Additional secret scanning
- **Private key detection**: Prevents committing SSH/TLS keys
- **Environment file check**: Blocks .env files
- **Console.log detection**: Enforces proper logging
- **TypeScript/ESLint**: Code quality and security

### Layer 2: GitHub Actions (Repository Protection)
- **CI Pipeline**: Runs on every push/PR
- **Security Scan**: Daily automated security audits
- **Dependency Audit**: Vulnerability scanning
- **Multiple secret detectors**: Gitleaks + TruffleHog + Semgrep
- **CodeQL**: Static analysis security testing (SAST)

### Layer 3: Branch Protection (Policy Protection)
- **Required status checks**: All security scans must pass
- **Required reviewers**: Human review required
- **No direct pushes**: All changes via Pull Requests
- **Conversation resolution**: All comments must be addressed
- **Linear history**: Clean git history

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.gitleaks.toml` | Gitleaks secret detection rules |
| `.pre-commit-config.yaml` | Local pre-commit hook configuration |
| `.secrets.baseline` | Known secrets baseline for detect-secrets |
| `commitlint.config.js` | Commit message format enforcement |
| `.github/workflows/security-scan.yml` | Automated security scanning |
| `.github/workflows/ci.yml` | CI/CD pipeline with security checks |

## 🛡️ Secret Detection Rules

### Patterns Detected:
- **API Keys**: Aptos Build Secret, CoinMarketCap, RWA API keys
- **GitHub Tokens**: Personal access tokens, app tokens
- **Cloud Tokens**: Vercel, AWS, Azure credentials
- **Private Keys**: SSH, TLS, JWT tokens
- **Environment Variables**: Hardcoded secrets in .env files

### Allowed Patterns:
- **Blockchain Addresses**: Aptos 32-byte hex addresses
- **Test Values**: Anything starting with `test-`, `example`, `mock`
- **Development URLs**: localhost, 127.0.0.1 references
- **Public Keys**: Known public API keys (like Panora public key)

## 🚨 What Happens When Secrets Are Detected

### Pre-commit (Local):
1. **Commit blocked** ❌
2. **Error message displayed** with file/line
3. **Must fix before proceeding**

### GitHub Actions (Remote):
1. **CI/CD pipeline fails** ❌
2. **PR cannot be merged**
3. **Security team notified** (if configured)
4. **Detailed report generated**

### Branch Protection:
1. **PR merge blocked** until all checks pass
2. **Status checks must be green**
3. **Manual review required**

## 🔄 Development Workflow

### Making Changes:

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make your changes
# ... edit files ...

# 3. Pre-commit hooks run automatically on commit
git add .
git commit -m "feat: add new feature"

# 4. If hooks fail, fix issues and retry
# ... fix detected issues ...
git add .
git commit -m "feat: add new feature"

# 5. Push to GitHub
git push origin feature/your-feature

# 6. Create Pull Request
# - All security checks run automatically
# - Must pass before merge allowed
```

### If Secrets Are Detected:

```bash
# 1. Identify the secret
cat .gitleaks-report.json  # or check pre-commit output

# 2. Remove the secret
# Edit the file to remove hardcoded secret

# 3. Use environment variable instead
echo "API_KEY=your_secret_here" >> .env.local  # DO NOT COMMIT

# 4. Update code to use process.env.API_KEY

# 5. Retry commit
git add .
git commit -m "fix: remove hardcoded secret"
```

## 🧪 Testing Security Setup

### Test Pre-commit Hooks:

```bash
# Test all hooks on all files
pre-commit run --all-files

# Test specific hook
pre-commit run gitleaks --all-files
pre-commit run detect-secrets --all-files

# Test commit message format
echo "invalid commit message" | pre-commit run commitlint --hook-stage commit-msg
```

### Test Secret Detection:

```bash
# Create a test file with fake secret (DO NOT COMMIT THIS)
echo "API_KEY=sk_test_123456789abcdef" > test-secret.txt

# Try to commit (should fail)
git add test-secret.txt
git commit -m "test: add secret"

# Clean up
rm test-secret.txt
git reset HEAD
```

## 🏥 Troubleshooting

### Pre-commit Issues:

```bash
# Update pre-commit hooks
pre-commit autoupdate

# Clean pre-commit cache
pre-commit clean

# Skip hooks (emergency only - NOT RECOMMENDED)
git commit --no-verify -m "emergency commit"
```

### False Positives:

```bash
# Add to .gitleaks.toml allowlist
# Add to .secrets.baseline
detect-secrets scan --baseline .secrets.baseline --update

# Mark as not a secret in baseline
detect-secrets audit .secrets.baseline
```

### GitHub Actions Failing:

1. Check the **Actions** tab in GitHub
2. Look for **security-scan** or **ci** workflow failures
3. Review the logs for specific error messages
4. Fix issues locally and push updates

## 🔄 Maintenance

### Weekly Tasks:
- Review security alerts in GitHub
- Update dependencies with security patches
- Review any new secret detection alerts

### Monthly Tasks:
- Update pre-commit hook versions
- Review and update .gitleaks.toml rules
- Audit secret detection baseline
- Review branch protection settings

### Quarterly Tasks:
- Security audit of the entire codebase
- Review and update security policies
- Team training on security practices

## 🆘 Emergency Procedures

### If Secrets Are Accidentally Committed:

1. **Immediately revoke the exposed secrets**
2. **Remove from git history**:
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # WARNING: This rewrites history
   ```
3. **Force push cleaned history** (if repository is not yet public)
4. **Generate new secrets**
5. **Update all deployment environments**
6. **Review access logs** for potential unauthorized usage

### If Security Checks Are Blocking Critical Fixes:

1. **Never use `--no-verify`** unless absolutely critical
2. **Get security team approval** for bypassing checks
3. **Document the exception** in commit message
4. **Follow up with proper fix** immediately

## 📞 Support

- **GitHub Discussions**: For general questions
- **Security Issues**: Email as per SECURITY.md
- **Pre-commit Issues**: Check [pre-commit documentation](https://pre-commit.com)
- **Gitleaks Issues**: Check [Gitleaks documentation](https://github.com/zricethezav/gitleaks)

Remember: Security is everyone's responsibility! 🛡️