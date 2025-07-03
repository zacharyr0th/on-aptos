# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Common Development Tasks

- `pnpm dev` - Start development server with turbopack on port 3001
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server on port 3001
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### Testing

- `pnpm test` - Run Vitest tests
- `pnpm test:run` - Run tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI interface

### Build Analysis

- `pnpm analyze` - Analyze bundle size
- `pnpm analyze:server` - Analyze server bundle
- `pnpm analyze:browser` - Analyze browser bundle

### Maintenance

- `pnpm clean` - Clean all dependencies and reinstall
- `pnpm sitemap` - Generate sitemap
- `pnpm translate-locales` - Translate localization files

## Code Architecture

### High-Level Structure

This is a Next.js 15 application using tRPC for type-safe API communication. The app tracks token supplies, prices, and DeFi analytics for the Aptos blockchain ecosystem.

### Key Directories

- `app/` - Next.js 15 app router pages and API routes
- `lib/trpc/` - tRPC configuration and domain-based routers
- `components/` - React components organized by feature
- `lib/utils/` - Shared utilities and helper functions
- `lib/config/` - Configuration and environment validation
- `hooks/` - Custom React hooks
- `public/` - Static assets including token icons and locales

### tRPC Architecture (Domain-Driven Design)

The tRPC implementation follows a domain-based structure:

- **domains/assets/** - Asset tracking (bitcoin, stablecoins, LST, RWA)
- **domains/market-data/** - Market data and analytics (prices, defi metrics)
- **domains/blockchain/** - Blockchain-specific functionality (aptos)
- **domains/protocols/** - External protocol integrations

All legacy flat routers have been migrated to this domain structure.

### Core Technologies

- **Next.js 15** with App Router
- **tRPC** for type-safe API layer
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for component primitives
- **Vitest** for testing
- **React Query** (via tRPC) for data fetching
- **Zod** for schema validation

### Data Flow

1. Frontend components use tRPC hooks for data fetching
2. tRPC routers handle API logic with caching and error handling
3. External APIs (CoinMarketCap, Panora, Aptos Indexer) provide data sources
4. LRU caching with TTL manages API response caching
5. Graceful fallbacks handle API failures

### Environment Variables

Required API keys:

- `CMC_API_KEY` - CoinMarketCap API key
- `RWA_API_KEY` - RWA.xyz API key (optional)
- `PANORA_API_KEY` - Panora Exchange API key (optional)
- `APTOS_BUILD_KEY` - Aptos Indexer API key (optional)

### Testing Strategy

- Unit tests for utilities and services
- Integration tests for tRPC routers
- API endpoint tests
- Test setup in `tests/setup.ts`

### Internationalization

- Multi-language support with i18next
- Localization files in `public/locales/`
- Supported languages: en, es, fr, de, ja, ko, zh-CN, hi, ar, ha, ru, pt

### Deployment

- Configured for Vercel deployment
- Docker support with standalone output
- PWA capabilities with caching strategies
- Bundle analysis for optimization

## Important Notes

### When Working with tRPC

- All API logic should use the domain-based router structure
- New procedures should be added to appropriate domain routers
- Use Zod schemas for input/output validation
- Leverage built-in caching and error handling

### Code Style

- Uses Prettier for formatting
- ESLint for linting
- TypeScript strict mode enabled
- Component props should be typed with interfaces

### Performance Considerations

- LRU caching with configurable TTL
- Bundle analysis tools available
- Image optimization configured for external sources
- PWA caching strategies implemented

### Security

- Environment validation with Zod
- Rate limiting on API endpoints
- CORS configuration
- No sensitive data in client-side code
