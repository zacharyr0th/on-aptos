# Production Setup Guide

This guide covers the environment variables and configuration needed for production deployment.

## Required Environment Variables

### Dune Analytics API
The metrics dashboard (`/metrics`) requires a Dune Analytics API key to function properly.

1. **Get a Dune API Key**
   - Sign up at [dune.com](https://dune.com)
   - Navigate to Settings → API Keys
   - Create a new API key
   - Copy the key (it starts with a long alphanumeric string)

2. **Configure in Vercel**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add: `DUNE_API_KEY_TOKEN` = `your_dune_api_key_here`
   - Make sure to add it for Production, Preview, and Development environments

3. **Redeploy**
   - After adding the environment variable, trigger a new deployment
   - The `/metrics` page should now work

### Other Optional Environment Variables

```bash
# CoinMarketCap (for token price data)
CMC_API_KEY=your_cmc_api_key
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com/v2

# Aptos Indexer (optional - for better rate limits)
NEXT_PUBLIC_APTOS_INDEXER_URL=https://aptos-mainnet.nodit.io/v1/graphql
APTOS_BUILD_SECRET=your_secret
APTOS_BUILD_KEY=your_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.on-aptos.com
```

## Vercel Deployment Configuration

The project is configured in `vercel.json` with:
- Function timeout: 10 seconds (suitable for API routes)
- Region: `iad1` (US East)
- Build command: `bun run build`
- Framework: Next.js

## Troubleshooting

### Metrics page shows 404
- **Cause**: Missing `DUNE_API_KEY_TOKEN` environment variable or build failed
- **Solution**:
  1. Verify the environment variable is set in Vercel
  2. Check the deployment logs for build errors
  3. Redeploy after adding the variable

### API routes timeout
- **Cause**: Dune queries taking too long (default 10s timeout)
- **Solution**: Consider increasing `maxDuration` in `vercel.json` for the metrics routes:
  ```json
  "functions": {
    "app/api/metrics/**/*.ts": {
      "maxDuration": 30
    }
  }
  ```

### Data not loading
- **Cause**: API key invalid or rate limited
- **Solution**:
  1. Verify the API key is correct and active
  2. Check Dune Analytics dashboard for rate limit status
  3. Review API logs in Vercel for specific error messages

## Monitoring

- Check Vercel deployment logs for errors
- Monitor Dune API usage in your Dune dashboard
- Set up Vercel Analytics for frontend monitoring
