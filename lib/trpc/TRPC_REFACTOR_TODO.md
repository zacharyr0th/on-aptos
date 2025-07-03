# tRPC Organization Refactor - TODO List

## Phase 1: Create New Structure ✅

- [x] Create new directory structure under `/lib/trpc/`
  - [x] Create `core/` directory
  - [x] Create `shared/` directory with subdirectories
  - [x] Create `domains/` directory with subdirectories
- [x] Move shared utilities to `shared/`
- [x] Extract response building logic
- [x] Create base router templates

## Phase 2: Migrate Domains One by One

### 2.1 Migrate Prices Domain (Simplest) ✅

- [x] Create `domains/market-data/prices/` structure
- [x] Extract price services from existing routers
- [x] Create focused router file
- [x] Update imports

### 2.2 Migrate Bitcoin Domain ✅

- [x] Create `domains/assets/bitcoin/` structure
- [x] Extract BTC business logic to services
- [x] Split btc.ts (610 lines) into focused files
- [x] Update imports
- [x] Update bitcoin page to use new domain structure
- [x] Delete old btc.ts router file
- [x] Remove btc router from root router
- [x] Update API routes to use new domain structure

### 2.3 Migrate Stablecoins Domain ✅

- [x] Create `domains/assets/stablecoins/` structure
- [x] Extract stablecoin services
- [x] Create focused router files
- [x] Update imports
- [x] Update stablecoins page to use new domain structure
- [x] Delete old stables.ts router file
- [x] Remove stables router from root router
- [x] Update API routes to use new domain structure

### 2.4 Migrate Liquid Staking Domain ✅

- [x] Create `domains/assets/liquid-staking/` structure
- [x] Extract LST services
- [x] Create focused router files
- [x] Update imports

### 2.5 Migrate Blockchain Domain ✅

- [x] Create `domains/blockchain/aptos/` structure
- [x] Extract Aptos-specific functionality
- [x] Create focused router files
- [x] Update imports

### 2.6 Migrate Protocol Domains ✅

- [x] Create `domains/protocols/echelon/` structure
- [x] Create `domains/protocols/thala/` structure
- [x] Extract protocol-specific services
- [x] Update imports

### 2.7 Migrate DeFi Metrics Domain ✅

- [x] Create `domains/market-data/defi-metrics/` structure
- [x] Extract TVL, volume, protocol metrics
- [x] Create focused router files
- [x] Update imports

### 2.8 Migrate RWA Domain ✅

- [x] Create `domains/assets/rwa/` integration
- [x] Migrate RWA router to domains structure
- [x] Update root router to remove legacy RWA reference
- [x] Complete migration of all legacy routers

## Phase 3: Update Root Router ✅

- [x] Update root.ts to use new structure (complete - all domains migrated)
- [x] Ensure backward compatibility (maintained during transition)
- [x] Update client imports (working correctly)
- [x] Test all endpoints (all endpoints working)
- [x] Remove all legacy router references from root

## Phase 4: Cleanup ✅

- [x] Remove old btc router file
- [x] Update root router to remove btc references
- [x] Update API routes that used old btc router
- [x] Remove all legacy router references from root router
- [x] Update all router imports to use core/server directly
- [x] Add tests for new structure (Vitest setup complete)
- [x] Update component imports (completed)

## Shared Utilities Implementation ✅

- [x] Implement `response-builder.service.ts`
- [x] Implement `cache.service.ts`
- [x] Implement `external-api.service.ts`
- [x] Create common schemas
- [x] Create shared middleware

## 🎉 REFACTOR COMPLETE! All Phases Finished ✅

**Final Status:**

- ✅ **ALL DOMAINS MIGRATED** - Bitcoin, Stablecoins, Liquid Staking, RWA, Blockchain, Protocols, DeFi Metrics
- ✅ **CLEAN DOMAIN STRUCTURE** - All legacy routers migrated to organized domain-based structure
- ✅ **ROOT ROUTER UPDATED** - Completely domain-based, no legacy router references
- ✅ **IMPORT MIGRATION COMPLETE** - All routers now use core/server directly
- ✅ **TESTING INFRASTRUCTURE** - Vitest setup complete with API and TRPC router tests
- ✅ **CODE CLEANUP** - All console.log statements removed, TODO comments addressed
- ✅ **PRODUCTION READY** - Codebase is clean, organized, and ready for deployment

**Final Architecture:**

```
domains/
├── market-data/       # Market data and analytics
│   ├── prices/
│   └── defi-metrics/
├── assets/           # Asset tracking
│   ├── bitcoin/
│   ├── stablecoins/
│   ├── liquid-staking/
│   └── rwa/
├── blockchain/       # Blockchain functionality
│   └── aptos/
└── protocols/        # External protocol integrations
    ├── echelon/
    ├── thala/
    └── ...
```

🚀 **The tRPC refactor is complete and the codebase is production-ready!**
