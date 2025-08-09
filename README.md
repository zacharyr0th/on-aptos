# On Aptos

A comprehensive blockchain analytics platform for the Aptos ecosystem, providing real-time insights into DeFi protocols, stablecoins, Bitcoin on Aptos, RWAs, and portfolio management.

## Features

- **Portfolio** - Wallet analytics with tokens, NFTs, DeFi positions, and yield opportunities
- **Stablecoins** - Track 12+ stablecoins with supply and price metrics
- **Bitcoin** - Monitor wrapped BTC variants (aBTC, xBTC, WBTC, SBTC)
- **RWAs** - Real-world asset tokenization analytics
- **DeFi** - Protocol TVL, fees, volume, and APY tracking

## Screenshots

![Landing Page](public/readme/landing.png)

### Portfolio Tracker
![Tokens Portfolio](public/readme/tokens.png)
![All Tokens View](public/readme/tokens-all.png)
![NFT Collections](public/readme/nfts.png)
![DeFi Overview](public/readme/defi.png)

### Analytics Dashboards
![Stablecoins Dashboard](public/readme/stables.png)
![Bitcoin on Aptos](public/readme/btc.png)
![RWA Dashboard](public/readme/rwa.png)
![RWA Analytics](public/readme/rwa-2.png)
![DeFi Dashboard](public/readme/defi-dashboard.png)

## Tech Stack

**Frontend**: Next.js 15.3, React 19, TypeScript 5.8  
**UI**: Tailwind CSS v4, Shadcn/ui, Radix UI  
**Data**: Aptos Indexer, Panora API, CoinMarketCap, RWA.xyz, DeFi Llama  
**Performance**: React Window, Virtual scrolling, PWA, Code splitting  
**Tools**: Pino logger, Vitest, Bundle analyzer

## Architecture

### Frontend
- Next.js 15 App Router with Server Components
- Feature-based component organization
- Virtualized lists for large datasets
- IPFS gateway fallback for media
- Strict TypeScript throughout

### Backend
- API routes with Node.js runtime
- Service layer for business logic separation
- Centralized protocol registry
- Multi-tier caching (memory, CDN, browser)
- Exponential backoff and graceful degradation

### Data Flow

1. **Batch API** - Single request to `/api/portfolio/batch`
2. **Staggered Loading** - Assets first, then DeFi (200ms), NFTs (500ms)
3. **Progressive Rendering** - Skeleton UI with incremental updates
4. **Smart Caching** - 5-minute price cache, CDN edge caching
5. **NFT Pagination** - 50 items per batch with lazy loading

## Services

- **AssetService** - Token balances and pricing
- **NFTService** - NFT fetching with collection stats
- **DeFiService** - Multi-protocol positions
- **YieldAggregator** - Yield opportunity discovery
- **PanoraService** - Token metadata and prices
- **SimpleCache** - In-memory caching with TTL

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- Git
- API keys (see Environment Setup below)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/on-aptos.git
cd on-aptos
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your API keys in `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://on-aptos.com
APTOS_BUILD_SECRET=your_key    # Aptos Indexer API
PANORA_API_KEY=your_key        # Token prices
CMC_API_KEY=your_key           # Market data
RWA_API_KEY=your_key           # RWA analytics
```

5. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### API Keys

- **Aptos Indexer**: Get from [Aptos Build](https://developers.aptoslabs.com/)
- **Panora**: Public key available in CLAUDE.md or request dedicated key via Discord
- **CoinMarketCap**: Sign up at [CoinMarketCap API](https://coinmarketcap.com/api/)
- **RWA.xyz**: Contact for access



## 🔐 Security

This repository implements **enterprise-grade security** with multiple layers of protection against secret leaks and security vulnerabilities.

### 🛡️ Multi-Layer Protection

#### **Layer 1: Local Pre-Commit Protection**
- **Gitleaks**: Custom rules for API key detection (Aptos, CoinMarketCap, RWA)
- **detect-secrets**: Additional secret scanning with baseline management
- **Private key detection**: Prevents SSH/TLS key commits
- **Environment validation**: Blocks .env files from being committed
- **Code quality**: TypeScript, ESLint, console.log detection
- **Commit message validation**: Enforces conventional commits

#### **Layer 2: Automated Repository Scanning**
- **Daily security scans** at 2 AM UTC
- **Multiple secret detectors**: Gitleaks + TruffleHog + Semgrep
- **Static Analysis Security Testing (SAST)**: CodeQL for vulnerability detection
- **Dependency vulnerability scanning**: npm audit + Snyk + Dependabot
- **Environment security checks**: Validates no secrets in committed files
- **CI/CD integration**: All security checks run on every PR

#### **Layer 3: Branch Protection Policies**
- **Required status checks**: All security scans must pass before merge
- **Pull request reviews**: Human review required for all changes
- **Conversation resolution**: All PR comments must be addressed
- **Linear history**: Clean git history with no merge commits
- **No direct pushes**: All changes must go through PR process

### 🔍 Secret Detection Coverage

**Detected Patterns:**
- Aptos Build Secrets (`AG-*` format)
- API Keys (CoinMarketCap UUID, RWA hex keys)
- Cloud tokens (Vercel, AWS, GitHub, NPM)
- Private keys (SSH, TLS, JWT)
- Hardcoded credentials in source files

**Safe Patterns (Allowed):**
- Blockchain addresses (Aptos 32-byte hex)
- Public API keys (documented as public)
- Test/example/mock values
- Development localhost URLs

### 🚨 Security Workflow

#### **Setup (One-time)**
```bash
# Install all security hooks and tools
pnpm hooks:install

# Verify security configuration
pnpm security:scan
pnpm hooks:run
```

#### **Development Workflow**
1. **Make changes** → Pre-commit hooks automatically scan for secrets
2. **Commit blocked** if secrets detected → Fix issues and retry
3. **Push to GitHub** → Automated security scans run on PR
4. **PR review** → All security checks must pass + human approval
5. **Merge allowed** only when all security layers pass ✅

#### **If Secrets Are Detected**
```bash
# 1. View detection details
cat .gitleaks-report.json

# 2. Remove hardcoded secret from code
# Replace with environment variable: process.env.API_KEY

# 3. Add to local environment (never commit)
echo "API_KEY=your_secret" >> .env.local

# 4. Update secrets baseline if needed
pnpm security:baseline

# 5. Retry commit
git commit -m "fix: remove hardcoded secret"
```

### 📁 Security Configuration Files

| File | Purpose |
|------|---------|
| `.gitleaks.toml` | Custom secret detection rules for our APIs |
| `.pre-commit-config.yaml` | Local git hooks configuration |
| `.secrets.baseline` | Known pattern baseline for detect-secrets |
| `commitlint.config.js` | Commit message format validation |
| `.github/workflows/security-scan.yml` | Daily automated security scanning |
| `.github/workflows/ci.yml` | CI/CD with integrated security checks |
| `.github/branch-protection.md` | Branch protection setup guide |
| `.github/SECURITY_SETUP.md` | Complete security setup documentation |

### 🔧 Security Commands

```bash
# Security scanning
pnpm security:scan          # Run Gitleaks secret detection
pnpm security:baseline      # Update secrets baseline
pnpm security:audit         # Review detected secrets

# Pre-commit hooks
pnpm hooks:install          # Install git hooks
pnpm hooks:update          # Update hook versions  
pnpm hooks:run             # Run all hooks on all files

# Development
pnpm lint                  # Code quality and security linting
pnpm test                  # Run security-aware test suite
pnpm build                 # Build with security validations
```

### 🎯 Security Benefits

- **Zero secrets leaked**: Multiple detection layers prevent any secret commits
- **Automated enforcement**: No manual security reviews needed
- **Developer friendly**: Clear error messages and fix guidance
- **Comprehensive coverage**: 6+ different security scanning tools
- **Industry standard**: Follows OWASP and enterprise security practices
- **Open source ready**: Professional security posture for public repositories
- **Continuous monitoring**: Daily scans and real-time PR protection

### 📖 Additional Resources

- **[Security Setup Guide](.github/SECURITY_SETUP.md)**: Complete setup and troubleshooting
- **[Branch Protection Guide](.github/branch-protection.md)**: GitHub protection configuration
- **[SECURITY.md](SECURITY.md)**: Security policy and vulnerability reporting

**Security is everyone's responsibility!** 🛡️ This multi-layer approach ensures your secrets stay safe while maintaining development velocity.

## Key Features

### Internationalization
- 12 languages (EN, ES, AR, DE, FR, HA, HI, JA, KO, PT, RU, ZH)
- On-demand translation loading
- RTL support for Arabic
- Browser language auto-detection

### Portfolio Analytics
- Multi-asset tracking (tokens, NFTs, DeFi)
- Available yield opportunities display
- Transaction history and categorization
- Collection distribution analytics

### Theme System
- Light/Dark mode with OS preference detection
- Persistent theme state
- Flicker-free transitions
- WCAG 2.1 AA compliance

## Performance

- **Initial Load**: ~1.2s for critical assets
- **Full Portfolio**: 3-5s with all data
- **Cached Loads**: <500ms
- **Optimizations**: Code splitting, tree shaking, lazy loading, DNS prefetching




## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Create production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix linting issues
pnpm typecheck    # Run TypeScript type checking
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm analyze      # Analyze bundle size
```

### Project Structure

```
on-aptos/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── layout/      # Layout components
│   ├── pages/       # Page-specific components
│   ├── ui/          # Reusable UI components
│   └── wallet/      # Wallet connection
├── lib/             # Core libraries
│   ├── config/      # Configuration
│   ├── services/    # API services
│   └── utils/       # Utility functions
├── public/          # Static assets
│   ├── icons/       # Icon assets
│   └── locales/     # Translation files
└── hooks/           # Custom React hooks
```

### Coding Standards

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for code formatting
- Pino logger for structured logging (no console.log)
- Component-based architecture
- Service layer for API calls

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Aptos Labs](https://aptoslabs.com/) for the blockchain infrastructure
- [Panora](https://panora.exchange/) for token data and pricing
- [DeFi Llama](https://defillama.com/) for DeFi analytics
- [RWA.xyz](https://rwa.xyz/) for RWA data
- The entire Aptos community for their support and contributions

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/on-aptos/issues)
- Community: [Discord](https://discord.gg/aptos)
- Documentation: [docs.on-aptos.com](https://docs.on-aptos.com)
