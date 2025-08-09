# Branch Protection Configuration

This file contains the recommended branch protection settings for the On Aptos repository. These settings should be configured in GitHub's repository settings under "Branches".

## Main Branch Protection Rules

### For `main` branch:

#### **General Settings**
- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Restrict pushes that create files larger than 5 MB** (recommended for this project)

#### **Branch Protection Rules**
1. **Require a pull request before merging**
   - ✅ **Dismiss stale PR approvals when new commits are pushed**
   - ✅ **Require review from code owners** (if CODEOWNERS file exists)
   - **Required number of reviewers before merging**: `1` (minimum)
   - ✅ **Allow specified actors to bypass required pull requests** (for admins only)

2. **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - **Required status checks**:
     - `🔍 Lint & Type Check`
     - `🧪 Test Suite (18)`
     - `🧪 Test Suite (20)` 
     - `🏗️ Build Check`
     - `🔐 Pre-commit Secret Detection`
     - `📦 Dependency Audit`
     - `🔍 Secret Detection (Gitleaks)`
     - `🔍 Secret Detection (TruffleHog)`
     - `🔍 Environment Security Check`

3. **Require conversation resolution before merging**
   - ✅ **Enabled** - All conversations must be resolved

4. **Require signed commits**
   - ⚠️ **Optional but recommended** - Requires developers to sign their commits

5. **Require linear history**
   - ✅ **Enabled** - Prevents merge commits, requires rebase or squash

6. **Require deployments to succeed before merging**
   - ❌ **Not applicable** - No deployment environments configured yet

#### **Restrictions**
- ✅ **Restrict pushes that create files larger than defined limits**
- ❌ **Do not allow force pushes** - Prevents history rewriting
- ❌ **Do not allow deletions** - Prevents accidental branch deletion

#### **Rules applied to administrators**
- ✅ **Include administrators** - Apply all rules to repo admins too

---

## Development Branch Protection (Optional)

### For `develop` branch (if using GitFlow):

#### **Branch Protection Rules**
1. **Require a pull request before merging**
   - **Required number of reviewers before merging**: `1`
   - ✅ **Dismiss stale PR approvals when new commits are pushed**

2. **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - **Required status checks**:
     - `🔍 Lint & Type Check`
     - `🧪 Test Suite (18)`
     - `🔐 Pre-commit Secret Detection`
     - `🔍 Secret Detection (Gitleaks)`

3. **Require conversation resolution before merging**
   - ✅ **Enabled**

4. **Allow force pushes**
   - ✅ **Allow for administrators only** - More flexibility for development

---

## Security-Focused Settings

### Repository Security Settings (Settings > Security & Analysis)

1. **Dependency Graph**
   - ✅ **Enabled** - Track dependencies

2. **Dependabot Alerts**
   - ✅ **Enabled** - Get notified of vulnerabilities
   
3. **Dependabot Security Updates**
   - ✅ **Enabled** - Automatic security updates

4. **Dependabot Version Updates**
   - ✅ **Enabled** - Keep dependencies up to date

5. **Code Scanning Alerts**
   - ✅ **Enabled** - CodeQL and other scanners

6. **Secret Scanning Alerts**
   - ✅ **Enabled** - GitHub's built-in secret detection

7. **Secret Scanning Push Protection**
   - ✅ **Enabled** - Prevent pushing secrets

---

## How to Apply These Settings

### Via GitHub Web UI:

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** or edit existing rules
5. Configure settings as specified above

### Via GitHub CLI:

```bash
# Example commands to set up branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"checks":[{"context":"🔍 Lint & Type Check"},{"context":"🧪 Test Suite (18)"},{"context":"🔐 Pre-commit Secret Detection"},{"context":"🔍 Secret Detection (Gitleaks)"}]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true \
  --field required_linear_history=true
```

### Via Repository API:

Use the [GitHub REST API](https://docs.github.com/en/rest/branches/branch-protection) to programmatically set up branch protection.

---

## Additional Security Recommendations

1. **Enable Two-Factor Authentication (2FA)** for all contributors
2. **Use CODEOWNERS file** to require review from specific team members
3. **Regular security audits** using the automated workflows
4. **Monitor security alerts** and act on them promptly
5. **Keep dependencies up to date** using Dependabot
6. **Regular backup** of important branches and releases

---

## Testing Branch Protection

After setting up branch protection:

1. Try to push directly to `main` - should be blocked
2. Create a PR with failing tests - should be blocked from merging
3. Create a PR with secrets - should be blocked by secret scanning
4. Verify status checks appear and must pass before merging

Remember: These settings provide strong protection against accidental commits and security issues while maintaining development velocity.