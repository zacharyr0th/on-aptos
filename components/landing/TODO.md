# Landing Components Standardization TODO

## Critical Priority

### 1. Remove USDT Cost Chart Duplication
- [ ] **File:** `BridgesSection.tsx` (lines 10-229)
- [ ] Remove entire USDT cost comparison chart and chain performance grid
- [ ] This content already exists in `WhyAptosSection.tsx` (lines 11-376)
- [ ] Consider if BridgesSection should focus only on actual bridges or be removed entirely
- [ ] **Impact:** Removes ~220 lines of duplicated code

### 2. Fix Mobile Responsiveness Issues

#### 2a. Chain Comparison Grid Mobile Breakpoints
- [ ] **Files:** `WhyAptosSection.tsx` (lines 215, 255, 296, 336), `BridgesSection.tsx` (lines 63, 105, 148, 190)
- [ ] Grid uses `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` - 2 columns on mobile is cramped
- [ ] **Issue:** 6 metrics per chain squeezed into 2 columns on small screens
- [ ] **Fix:** Consider horizontal scroll or accordion for mobile
- [ ] Chain logo column `w-16 md:w-20` is too small on mobile
- [ ] Font sizes in metric cards (text-xl) may be too large on mobile
- [ ] Gap values `gap-3` may need mobile-specific adjustment

#### 2b. Exchange Cards Grid Overflow
- [ ] **File:** `GettingStartedSection.tsx` (line 130)
- [ ] Uses `xl:grid-cols-4` which creates 1 column on mobile - good
- [ ] But card padding `p-6` might need mobile adjustment for smaller screens
- [ ] Badge positioning `absolute top-3 right-3` may overlap on small cards

#### 2c. Getting Started Steps Flow
- [ ] **File:** `GettingStartedSection.tsx` (line 77)
- [ ] `gap-8 md:gap-10` - large gaps on mobile may push content off-screen
- [ ] Step numbers positioned `absolute -top-2 -right-2` may not work on smaller viewports
- [ ] Icon sizes `w-20 h-20` consistent but may need mobile testing

#### 2d. Bridge Stats Grid Mobile Layout
- [ ] **File:** `GettingStartedSection.tsx` (line 241)
- [ ] Bridge stats use `grid-cols-3` with no mobile breakpoint
- [ ] **Issue:** Time/Fees/Networks in 3 columns may be too cramped on small screens
- [ ] Text sizes `text-xl` for bridge stats values may overflow
- [ ] Consider `grid-cols-2` or stacked layout for mobile

#### 2e. Network Performance Stats
- [ ] **File:** `WhyAptosSection.tsx` (line 147)
- [ ] Uses `grid-cols-2 lg:grid-cols-4` - good base
- [ ] Font size `text-5xl md:text-6xl` very large on mobile
- [ ] Gap values `gap-x-8 gap-y-10` may be excessive on small screens

#### 2f. Hero Section Cards on Mobile
- [ ] **File:** `HeroSection.tsx` (line 163)
- [ ] Grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] Works well, but stacked icon groups `flex -space-x-2` may need touch target review
- [ ] Icon size 8x8 (`w-8 h-8`) good for mobile

### 3. Standardize Section IDs
- [ ] **File:** `BridgesSection.tsx` - Add `id="bridges"` or remove section if redundant
- [ ] **File:** `YieldSection.tsx` - Add `id="yield"`
- [ ] **File:** `CTASection.tsx` - Add `id="cta"` or consider if this needs an ID
- [ ] Update `landing-data.ts` navigationSections array if new IDs are added

### 4. Standardize Section Wrapper Pattern
Create consistent pattern for all sections:
```tsx
<section id="section-name" className="py-20 px-0 relative overflow-hidden">
  {/* Background gradients */}
  <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />

  {/* Content */}
  <div className="container mx-auto relative z-10">
    <div className="max-w-6xl mx-auto">
      {/* Section content */}
    </div>
  </div>
</section>
```

Apply to:
- [ ] `BridgesSection.tsx`
- [ ] `YieldSection.tsx` (currently uses `bg-muted/30` directly)
- [ ] `CTASection.tsx`

## High Priority

### 5. Standardize Padding/Spacing Across Breakpoints
**Current inconsistencies:**
- Section vertical padding: `py-16`, `py-20`, `py-24`, `pt-16 pb-20` all used
- Hero section uses custom `pt-16 pb-20`
- Card padding varies: `p-6`, `p-8` inconsistent
- Inner container padding `py-16 px-4` only in GettingStartedSection
- No consistent mobile padding adjustments

**Recommendation:**
```tsx
// Major sections
className="py-12 md:py-16 lg:py-20 px-4 sm:px-6"

// Hero section (needs more top space)
className="pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20 px-4 sm:px-6"

// Cards
className="p-4 sm:p-6" // Regular cards
className="p-6 sm:p-8" // Feature cards
```

Files to update:
- [ ] All section components for consistent vertical padding with mobile overrides
- [ ] Add horizontal padding to all sections (`px-4 sm:px-6`)
- [ ] Hero section needs special treatment
- [ ] All Card components for responsive padding

### 6. Fix Card Grid Gaps for Mobile
**Current issues:**
- `gap-6` and `gap-8` used without mobile consideration
- Can cause horizontal overflow on narrow screens
- No consistent pattern

**Files to check:**
- [ ] `DefiSection.tsx` - Multiple grids with `gap-6` and `gap-8`
- [ ] `WhyAptosSection.tsx` - Uses `gap-6` for feature cards
- [ ] `GettingStartedSection.tsx` - Uses `gap-6`, `gap-8`, `gap-8 md:gap-10`
- [ ] `TokensSection.tsx` - Uses `gap-8`

**Recommendation:**
```tsx
className="gap-4 md:gap-6"  // Most grids
className="gap-6 md:gap-8"  // Larger feature sections
```

## Medium Priority

### 7. Standardize Header Sizing with Mobile-First Approach
Choose one pattern and apply consistently:

**Recommended Pattern:**
- Section H2: `text-3xl sm:text-4xl md:text-5xl` (Major sections)
- Section H3: `text-xl sm:text-2xl` (Subsections)
- Subtext: `text-base sm:text-lg md:text-xl`
- Hero H1: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` (Special case)

**Current issues:**
- HeroSection H1: `text-5xl md:text-7xl lg:text-8xl` - too large on mobile (320px width)
- WhyAptosSection H2: `text-5xl md:text-6xl` - no small breakpoint
- Network stats: `text-5xl md:text-6xl` - huge on mobile
- SubHeaders vary: some use `text-2xl md:text-3xl`, others just `text-2xl`

Files to update:
- [ ] `HeroSection.tsx` - H1 starts too large (line 132), subtext (line 141)
- [ ] `WhyAptosSection.tsx` - H2 (line 39), subtext (line 42), network stats (lines 149-170)
- [ ] `BridgesSection.tsx` - H2 (line 28)
- [ ] `DefiSection.tsx` - H2 (line 16), H3 (line 26)
- [ ] `TokensSection.tsx` - H2 (line 47)
- [ ] `YieldSection.tsx` - H2 (line 18)
- [ ] `GettingStartedSection.tsx` - H2 (line 17), H4 (line 72)
- [ ] `DevelopersSection.tsx` - H2 (line 20)
- [ ] `CommunitySection.tsx` - H2 (line 15)
- [ ] `CTASection.tsx` - H2 (line 10)

### 8. Extract Chain Performance Comparison Component
- [ ] Create new component: `components/performance/ChainComparisonGrid.tsx`
- [ ] Extract from `WhyAptosSection.tsx` (lines 203-375)
- [ ] Props: `chains` array with metrics data
- [ ] **Must include mobile optimization:** horizontal scroll or collapsible rows
- [ ] Reusable across multiple sections
- [ ] Remove from `BridgesSection.tsx` after extraction

### 9. Standardize Card Hover Effects
Apply consistent pattern:
```tsx
className="group relative p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30"

{/* Hover overlay */}
<div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
```

Files to review:
- [ ] All section files with Card components

### 10. Add Touch Target Improvements for Mobile
**WCAG Guidelines:** Minimum touch target should be 44x44px or 48x48px

Issues to check:
- [ ] Stacked icon groups using `-space-x-2` may be too small
  - HeroSection lines 168-173, 194-199, 220-225, 246-251
- [ ] Badge elements may need larger hit areas on mobile
- [ ] Small icon buttons in cards
- [ ] Link text sizes on mobile (Community section links)

**Recommendations:**
- Add `min-w-[44px] min-h-[44px]` to interactive elements
- Increase padding on small buttons/links: `p-3` minimum
- Test with mobile device or Chrome DevTools mobile view

## Low Priority

### 11. Test Horizontal Scroll on Mobile
Areas that may need testing:
- [ ] Developer tools carousel in `DevelopersSection.tsx` - uses Embla carousel
- [ ] Long content cards that may overflow
- [ ] Tables or grids without proper responsive handling
- [ ] Image galleries if any

### 12. Standardize Icon Usage in Headers
Choose pattern:
- **Option A:** No icons in section headers (cleaner)
- **Option B:** Icons in all section headers (more visual)

Currently mixed:
- TokensSection has icon with header
- CommunitySection has icon with header
- Others don't

### 13. Dark Mode Logo Handling
- [ ] Audit all logo/image usage for dark mode compatibility
- [ ] Apply consistent dark mode invert logic where needed
- [ ] Create utility component or class for conditional inversion
- [ ] Files to check: `GettingStartedSection.tsx` (line 48), `HeroSection.tsx`, others with logos

### 14. Standardize "use client" Directive
- [ ] Review `CTASection.tsx` - add if needed for Next.js client components
- [ ] Ensure all interactive sections have it

### 15. Protocol Stats Display Standardization
- [ ] Review `ProtocolStats.tsx` component usage in `DefiSection.tsx`
- [ ] Consider if similar pattern should be used in `GettingStartedSection.tsx` for exchange cards
- [ ] Standardize inline vs block layout patterns

## Nice to Have

### 16. Extract Repeated Card Patterns to Shared Components
- [ ] Create `ProtocolCard.tsx` for DeFi protocols
- [ ] Create `ExchangeCard.tsx` for exchanges
- [ ] Create `BridgeCard.tsx` for bridges
- [ ] Reduces duplication in section files
- [ ] **Must include responsive props** for mobile optimization

### 17. Consolidate Background Patterns
- [ ] Create utility classes or component for section backgrounds
- [ ] Standardize gradient colors and opacity values
- [ ] Consider extracting to Tailwind config

### 18. Data Organization
- [ ] Review `landing-data.ts` structure
- [ ] Consider splitting into multiple files by category
- [ ] Add TypeScript interfaces for all data structures

### 19. Add Skeleton Loaders for Better UX
- [ ] YieldSection already has skeleton (line 36-40)
- [ ] TokensSection has loading spinner (line 119-123)
- [ ] Consider adding to other async sections for consistency
- [ ] Ensure skeleton UI is responsive on mobile

## Questions to Resolve

1. **Should BridgesSection exist separately?** It duplicates WhyAptosSection content. Consider:
   - Removing BridgesSection entirely
   - Or making it focus only on bridge tools/guides
   - Or moving USDT chart to separate route

2. **Spacing consistency:** Should all sections use `py-20` or vary by importance?
   - Currently: py-16, py-20, py-24 are all used
   - **Recommendation:** Use responsive padding `py-12 md:py-16 lg:py-20` everywhere

3. **Container max-width:** Should all sections use `max-w-6xl` or vary?
   - Currently: max-w-3xl, max-w-5xl, max-w-6xl, max-w-7xl all used
   - WhyAptosSection uses max-w-7xl (line 36) - outlier
   - **Recommendation:** Standardize on max-w-6xl with exceptions for special cases

4. **Mobile breakpoint strategy:**
   - Currently uses: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
   - No mobile-first base styles in many places
   - **Recommendation:** Always start with mobile base, then add breakpoints

5. **Chart responsiveness:**
   - USDT Cost Chart uses fixed heights: `h-[500px] md:h-[600px]`
   - May need `h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]`

## Mobile Testing Checklist

After implementing fixes, test on:
- [ ] iPhone SE (375px width) - smallest modern phone
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone 14 Pro Max (430px width)
- [ ] Android small (360px width)
- [ ] Tablet portrait (768px width)
- [ ] Tablet landscape (1024px width)

**Key areas to test:**
- [ ] Chain comparison grids don't overflow
- [ ] All text is readable (not too small)
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scroll (unless intentional)
- [ ] Cards stack properly
- [ ] Images scale appropriately
- [ ] Buttons are fully clickable
- [ ] Navigation works smoothly
