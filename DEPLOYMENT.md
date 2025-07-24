# Vercel Deployment Guide

This guide covers deploying the On Aptos dashboard to Vercel using the automated CI/CD pipeline.

## CI/CD Pipeline Overview

The project uses GitHub Actions for automated building, testing, and Vercel deployment:

### Workflows

1. **Main CI/CD** (`.github/workflows/ci-cd.yml`)
   - Triggered on push to `main` and `develop` branches
   - Runs quality checks, security scans, deploys to Vercel
   - Preview deployments for PRs and develop branch
   - Production deployments for main branch

2. **PR Checks** (`.github/workflows/pr-checks.yml`) 
   - Runs on all pull requests
   - Comprehensive testing and quality checks
   - Bundle size analysis and accessibility testing

3. **Release** (`.github/workflows/release.yml`)
   - Triggered on version tags (`v*`)
   - Creates GitHub releases with changelogs
   - Production deployment with release notes

4. **Dependency Updates** (`.github/workflows/dependency-update.yml`)
   - Weekly automated dependency updates
   - Security vulnerability scanning

## Setup Instructions

### 1. Vercel Project Setup

1. **Create Vercel Account & Project**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   ```

2. **Get Vercel Project Details**
   ```bash
   # Get your project ID and org ID from .vercel/project.json
   cat .vercel/project.json
   ```

### 2. Repository Secrets

Configure these secrets in your GitHub repository settings:

```bash
# Vercel deployment credentials
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# API Keys
APTOS_BUILD_SECRET=your_build_secret
CMC_API_KEY=your_coinmarketcap_key
RWA_API_KEY=your_rwa_key
PANORA_API_KEY=your_panora_key

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_token

# Notifications (optional)
DISCORD_WEBHOOK=your_discord_webhook_url
SLACK_WEBHOOK=your_slack_webhook_url
```

### 3. Vercel Environment Variables

Set these in your Vercel dashboard (Project Settings > Environment Variables):

```bash
# Production
NEXT_PUBLIC_SITE_URL=https://on-aptos.com
APTOS_BUILD_SECRET=your_build_secret
CMC_API_KEY=your_coinmarketcap_key
RWA_API_KEY=your_rwa_key
PANORA_API_KEY=your_panora_key
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_token

# Preview (for staging/develop)
NEXT_PUBLIC_SITE_URL=https://on-aptos-git-develop-yourteam.vercel.app
# ... same API keys as production
```

## Deployment Process

### Automatic Deployment

1. **Development to Preview**
   ```bash
   git checkout develop
   git commit -am "feat: your changes"
   git push origin develop
   ```
   → Triggers preview deployment to Vercel

2. **Preview to Production**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```
   → Triggers production deployment to Vercel

3. **Release Deployment**
   ```bash
   # Create and push a version tag
   git tag v1.0.0
   git push origin v1.0.0
   ```
   → Creates GitHub release and deploys to production

### Manual Deployment

Using Vercel CLI:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

## Git Hooks & Quality

### Pre-commit Hooks (Husky)

Automatically run before each commit:
- **ESLint** - Code linting and fixes
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Tests** - Run test suite

### Commit Message Format

Using Conventional Commits:
```bash
# Examples
feat: add dark mode toggle
fix: resolve API timeout issue
docs: update deployment guide
style: format component files
refactor: extract utility functions
test: add unit tests for hooks
chore: update dependencies
```

### Lint-staged Configuration

Only processes staged files for faster commits:
- Runs ESLint with auto-fix
- Formats code with Prettier
- Type checks TypeScript files

## Monitoring & Health Checks

### Vercel Analytics

- **Performance Metrics** - Automatically tracked by Vercel
- **Core Web Vitals** - LCP, FID, CLS monitoring
- **Function Logs** - API route performance and errors

### Lighthouse CI

Automatic performance audits on production deployments:
- **Performance** - Min score 80%
- **Accessibility** - Min score 90%
- **Best Practices** - Min score 80%
- **SEO** - Min score 80%

### Error Tracking

```bash
# Sentry integration for error monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_token
```

## Rollback Process

### Vercel Rollback

1. **Via Vercel Dashboard**
   - Go to your Vercel project dashboard
   - Click on "Deployments" tab
   - Find previous successful deployment
   - Click "Promote to Production"

2. **Via GitHub Actions**
   - Go to your repository's Actions tab
   - Find the previous successful deployment
   - Click "Re-run jobs" to redeploy the previous version

3. **Via Vercel CLI**
   ```bash
   # List recent deployments
   vercel ls
   
   # Promote a previous deployment
   vercel promote <deployment-url> --prod
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs in GitHub Actions or Vercel dashboard
   # Common fixes:
   - Update dependencies: pnpm update
   - Fix TypeScript errors: pnpm tsc --noEmit
   - Check environment variables in Vercel dashboard
   - Clear build cache: vercel --force
   ```

2. **Vercel Function Timeouts**
   ```bash
   # Check function duration in vercel.json
   # Optimize API routes for better performance
   # Consider implementing caching strategies
   ```

3. **Environment Variable Issues**
   ```bash
   # Verify variables are set in Vercel dashboard
   # Check variable names match between local and Vercel
   # Ensure NEXT_PUBLIC_ prefix for client-side variables
   ```

### Log Analysis

```bash
# View function logs
vercel logs <deployment-url>

# View build logs
vercel logs <deployment-url> --build

# Real-time logs
vercel logs --follow
```

## Performance Optimization

### Vercel-specific Optimizations

1. **Edge Functions** - Use for geographically distributed logic
2. **Image Optimization** - Automatic WebP conversion and resizing
3. **Static Site Generation** - Pre-render pages where possible
4. **Incremental Static Regeneration** - Update static content dynamically

### Bundle Analysis

```bash
# Analyze bundle size
pnpm analyze

# View analysis in .next/analyze/
open .next/analyze/client.html
```

## Security Best Practices

1. **Environment Variables** - Store sensitive data in Vercel environment variables
2. **HTTPS Only** - Automatic SSL certificates via Vercel
3. **Security Headers** - Configured in vercel.json
4. **Rate Limiting** - Implement in API routes
5. **Input Validation** - Validate all API inputs

## Support

For deployment issues:
- Check GitHub Actions logs
- Review Vercel deployment logs
- Check Vercel function logs
- Create an issue using the bug report template

---

**Last Updated**: 2025-07-23