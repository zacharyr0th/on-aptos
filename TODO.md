# TypeScript 'any' Type Cleanup TODO

**Current Status**: 258 remaining 'any' type warnings (reduced from 367 - 109 fixed, 29% complete)

## Overview

This document outlines the systematic approach to eliminate the remaining TypeScript 'any' types in the codebase to improve type safety, catch errors at compile time, and enhance developer experience.

## Phase 1: Quick Fixes ✅ COMPLETED (109 warnings fixed)

### Error Handlers & Function Parameters

- [x] Fix catch blocks: `catch (error: any)` → `catch (error: unknown)`
- [x] Update function parameters: `(param: any)` → `(param: unknown)` or specific types
- [x] Replace array types: `any[]` → `unknown[]` or specific array types
- [x] Fix Record types: `Record<string, any>` → `Record<string, unknown>`
- [x] Fix type assertions: `as any` → `as unknown` or specific types

### Target Files:

- [x] `lib/utils/enhanced-transaction-analysis.ts` (3 warnings) ✅
- [x] `lib/utils/graceful-shutdown.ts` (4 warnings) ✅
- [x] `lib/utils/request-deduplication.ts` (3 warnings) ✅
- [x] `app/api/portfolio/batch/route.ts` (2 warnings) ✅
- [x] `app/portfolio/_components/layout/` files ✅

## Phase 2: API & External Data (Target: 50-80 warnings)

### Create Comprehensive Interfaces

- [ ] Panora API response types
- [ ] Aptos GraphQL schema interfaces
- [ ] NFT metadata structures
- [ ] Transaction event data types
- [ ] DeFi protocol response types

### Target Files:

- [ ] `app/api/portfolio/batch/route.ts` (2 warnings)
- [ ] `lib/services/portfolio/services/nft-service.ts` (multiple warnings)
- [ ] `lib/services/defi/scanner.ts` (multiple warnings)
- [ ] `lib/utils/token-logos.ts` (7 warnings)
- [ ] `lib/utils/token-utils.ts` (5 warnings)

## Phase 3: Component Architecture (Target: 30-50 warnings)

### Component Props & State

- [ ] Strengthen prop types for complex components
- [ ] Add proper event handler types
- [ ] Create union types for component states
- [ ] Fix React component render functions

### Target Files:

- [ ] `app/portfolio/_components/layout/MobileLayout.tsx` (1 warning)
- [ ] `app/portfolio/_components/layout/Sidebar.tsx` (1 warning)
- [ ] `app/portfolio/_components/shared/UnifiedNFTGrid.tsx` (1 warning)
- [ ] `app/portfolio/_components/shared/WalletSummary.tsx` (1 warning)
- [ ] `app/portfolio/_components/tables/TransactionHistoryTable.tsx` (multiple warnings)
- [ ] `app/portfolio/_guards/PerformanceOptimizations.tsx` (multiple warnings)

## Phase 4: Advanced & Edge Cases (Remaining warnings)

### Complex Scenarios

- [ ] Evaluate if `any` is actually appropriate in specific cases
- [ ] Add `@ts-expect-error` with explanations for legitimate uses
- [ ] Refactor dynamic object manipulation patterns
- [ ] Handle third-party library integration types

### Target Files:

- [ ] `lib/utils/request-deduplication.ts` (3 warnings)
- [ ] `lib/utils/response-builder.ts` (4 warnings)
- [ ] `lib/utils/portfolio-utils.ts` (2 warnings)
- [ ] Complex component files with multiple warnings

## Tools & Scripts to Create

### Analysis Tools

- [ ] `scripts/analyze-any-patterns.sh` - Identify common 'any' patterns
- [ ] `scripts/count-any-types.sh` - Track progress over time
- [ ] `scripts/categorize-any-usage.sh` - Group by file type and usage pattern

### Automated Fixes

- [ ] `scripts/fix-error-handlers.sh` - Safe error handler fixes
- [ ] `scripts/fix-array-types.sh` - Convert any[] to unknown[]
- [ ] `scripts/fix-function-params.sh` - Update simple function parameters

### Interface Generation

- [ ] `scripts/generate-interfaces.sh` - Create interfaces from API responses
- [ ] `scripts/create-type-guards.sh` - Generate type guard functions
- [ ] `scripts/validate-api-schemas.sh` - Ensure API response consistency

## Implementation Guidelines

### Safe Patterns to Use

```typescript
// ✅ Good: Use unknown for truly unknown data
function processData(data: unknown): ProcessedResult | null {
  if (!isValidData(data)) return null;
  // ... type narrowing
}

// ✅ Good: Specific error types
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

// ✅ Good: Proper interface definitions
interface ApiResponse {
  status: 'success' | 'error';
  data: Record<string, unknown>;
  timestamp: string;
}
```

### Patterns to Avoid

```typescript
// ❌ Bad: Keeping any without justification
function process(data: any): any {
  return data.whatever;
}

// ❌ Bad: Type assertions without validation
const result = apiResponse as any;
```

## Success Metrics

### Targets

- **Primary Goal**: Reduce from 283 to <50 'any' types
- **Build Performance**: No significant increase in build time
- **Runtime Safety**: Decrease in runtime type errors
- **Developer Experience**: Better IntelliSense and error catching

### Tracking

- [ ] Set up automated 'any' type counting in CI
- [ ] Weekly progress reports
- [ ] Performance benchmarks before/after major changes

## Timeline

- **Week 1**: Phase 1 (Quick fixes) + tooling setup
- **Week 2**: Phase 2 (API & external data interfaces)
- **Week 3**: Phase 3 (Component architecture)
- **Week 4**: Phase 4 (Edge cases and cleanup)

## Notes

- Start with files that have the highest impact and lowest risk
- Always run tests after making changes to ensure functionality is preserved
- Consider adding new type-related tests for critical paths
- Document any remaining intentional 'any' usage with explanations

---

**Last Updated**: 2025-01-22
**Progress**: 109/367 'any' types fixed (29% complete)

## Completed Work ✅

### Phase 1 Automated Fixes (109 total fixes)

- Fixed all `Record<string, any>` → `Record<string, unknown>` patterns
- Fixed all `catch (error: any)` → `catch (error: unknown)` patterns
- Fixed all `any[]` → `unknown[]` patterns
- Fixed common `as any` type assertions
- Fixed function parameters in utility files
- Created comprehensive automation scripts

### Key Files Fixed

- `app/api/portfolio/batch/route.ts` - API response types
- `app/portfolio/_components/layout/` - Component prop types
- `lib/utils/enhanced-transaction-analysis.ts` - Transaction types
- `lib/utils/graceful-shutdown.ts` - Server shutdown types
- `lib/utils/request-deduplication.ts` - Generic utility types
