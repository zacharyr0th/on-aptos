# Development Scripts

This directory contains various scripts to help with development, testing, and quality assurance.

## 🚀 Quick Start

```bash
# Test if your code will pass GitHub CI
./scripts/ci-test.sh

# Auto-fix common issues
./scripts/fix-common-issues.sh

# Run all quality checks
./scripts/quality-check.sh
```

## 📋 Available Scripts

### CI Testing

- **`ci-test.sh`** - Simulate GitHub CI locally
  - Tests TypeScript compilation, linting, build, secrets, deprecated tables
  - Exact same checks as GitHub CI
  - Colored output with detailed error reporting
  - Exit code 0 = CI will pass, 1 = CI will fail

### Auto-Fix Tools

- **`fix-common-issues.sh`** - Automatically fix common problems
  - Auto-fix linting issues with `--fix`
  - Format code with Prettier
  - Replace console statements with logger (where possible)
  - Organize imports

### Individual Quality Checks

- **`check-console.sh`** - Find console statements in source code
- **`check-secrets.sh`** - Detect secrets and API keys
- **`check-deprecated-tables.sh`** - Find deprecated Aptos indexer tables
- **`quality-check.sh`** - Run all individual checks

## 🔧 Usage Examples

### Before Committing

```bash
# Check if commit will pass CI
./scripts/ci-test.sh

# If issues found, try auto-fixing
./scripts/fix-common-issues.sh

# Re-test after fixes
./scripts/ci-test.sh
```

### Debugging Specific Issues

```bash
# Check only console statements
./scripts/check-console.sh

# Check only for secrets
./scripts/check-secrets.sh

# Check only for deprecated tables
./scripts/check-deprecated-tables.sh
```

### Pre-Push Workflow

```bash
# 1. Auto-fix what can be fixed
./scripts/fix-common-issues.sh

# 2. Review changes
git diff

# 3. Test everything
./scripts/ci-test.sh

# 4. If passing, commit and push
git add .
git commit -m "Fix quality issues"
git push
```

## 🎯 Script Details

### ci-test.sh

- **Purpose**: Simulate exact GitHub CI checks locally
- **Checks**: TypeScript, linting, build, console statements, secrets, deprecated tables, tests
- **Output**: Colored results with pass/fail status
- **Exit codes**: 0 = all pass, 1 = some failed

### fix-common-issues.sh

- **Purpose**: Automatically fix issues that don't need manual intervention
- **Fixes**: Linting (with --fix), code formatting, simple console→logger replacements
- **Safety**: Only modifies files that already have proper imports

### Individual Check Scripts

- **Purpose**: Focus on specific issue types
- **Benefits**: Faster debugging, targeted fixes
- **Integration**: Used by both quality-check.sh and ci-test.sh

## 🚦 CI Status Indicators

### ✅ All Good

```
🎉 ALL CHECKS PASSED! (6/6)
✅ Your code will pass GitHub CI!
🚀 Ready to deploy!
```

### ❌ Issues Found

```
❌ SOME CHECKS FAILED (4/6 passed)
Failed checks:
  • Lint Check
  • Console Statements Check
🛠️ Fix the issues above before pushing to GitHub
```

## 🔍 What Each Check Does

| Check                 | Purpose          | Fails When                  |
| --------------------- | ---------------- | --------------------------- |
| **TypeScript**        | Type safety      | Type errors, missing types  |
| **Lint**              | Code style       | ESLint rule violations      |
| **Build**             | Compilation      | Build errors, missing deps  |
| **Console**           | Clean logging    | `console.*` in source code  |
| **Secrets**           | Security         | API keys, passwords in code |
| **Deprecated Tables** | Aptos compliance | Old indexer table usage     |
| **Tests**             | Functionality    | Test failures (optional)    |

## 💡 Tips

1. **Run `ci-test.sh` before every commit** - Saves time by catching issues early
2. **Use `fix-common-issues.sh` first** - Automatically fixes many problems
3. **Check individual scripts for debugging** - Faster than running all checks
4. **Scripts are safe to run multiple times** - Idempotent operations
5. **All scripts respect .gitignore** - Won't check generated files

## 🛠️ Customization

Scripts can be customized by editing the patterns in each file:

- Modify secret detection patterns in `check-secrets.sh`
- Add new deprecated tables to `check-deprecated-tables.sh`
- Adjust console replacement rules in `fix-common-issues.sh`

## 🔗 Integration

These scripts integrate with:

- **GitHub CI** - Same checks run in `.github/workflows/quality-checks.yml`
- **Pre-commit hooks** - Can be used as git hooks
- **IDE integration** - Can be run from VS Code tasks
- **Local development** - Part of normal development workflow
