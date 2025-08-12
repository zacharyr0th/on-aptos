# On Aptos

A comprehensive blockchain analytics platform for the Aptos ecosystem, providing real-time insights into DeFi protocols, stablecoins, Bitcoin on Aptos, RWAs, and portfolio management.

## Features

- **Portfolio** - Wallet analytics with tokens, NFTs, DeFi positions, and yield opportunities
- **Tokens** - Comprehensive token analytics and market data across the Aptos ecosystem
- **Yields** - Discover and compare yield opportunities across DeFi protocols
- **Stablecoins** - Track 12+ stablecoins with supply and price metrics
- **Bitcoin** - Monitor wrapped BTC variants (aBTC, xBTC, WBTC, SBTC)
- **RWAs** - Real-world asset tokenization analytics
- **DeFi** - Protocol TVL, fees, volume, and APY tracking

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Data**: Aptos Indexer, Panora API, CoinMarketCap, RWA.xyz, DeFi Llama
- **Performance**: Virtual scrolling, PWA, code splitting, multi-tier caching

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- API keys (see below)

### Installation

1. Clone and install:

```bash
git clone https://github.com/yourusername/on-aptos.git
cd on-aptos
pnpm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Add API keys to `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://on-aptos.com
APTOS_BUILD_SECRET=your_key    # From developers.aptoslabs.com
PANORA_API_KEY=your_key        # See CLAUDE.md for public key
CMC_API_KEY=your_key           # From coinmarketcap.com/api
RWA_API_KEY=your_key           # Contact for access
```

4. Start development:

```bash
pnpm dev
```

## Development

```bash
pnpm dev          # Start development server
pnpm build        # Create production build
pnpm lint         # Run linting
pnpm typecheck    # TypeScript checking
pnpm test         # Run tests
```

## Security

Multi-layer security with automated secret detection, pre-commit hooks, and CI/CD scanning. See `.github/SECURITY_SETUP.md` for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/on-aptos/issues)
- Community: [Discord](https://discord.gg/aptos)
