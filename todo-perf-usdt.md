# Performance & USDT Pages - Mobile Responsiveness TODO

## 🎯 Goal
Make performance and USDT comparison pages work on ALL screen sizes while **preserving desktop experience exactly as-is**.

## ✅ Current Desktop State
- Works perfectly on 16" Mac in Brave
- All layouts, proportions, and interactions should remain unchanged for desktop (1024px+)
- Only add responsive breakpoints for smaller screens

## 🚨 Critical Issues to Fix

### 1. USDTComparisonPage Layout Structure
**File**: `components/pages/performance/USDTComparisonPage.tsx:226`

**Current (Desktop-only)**:
```tsx
<div className="flex gap-12 items-stretch h-[70vh]">
  <div className="w-2/5 flex flex-col"> {/* Cost Cards */}
  <div className="w-3/5 flex flex-col"> {/* Chart */}
```

**Fix (Preserve Desktop)**:
```tsx
<div className="flex flex-col lg:flex-row gap-6 lg:gap-12 lg:items-stretch lg:h-[70vh]">
  <div className="w-full lg:w-2/5 flex flex-col order-2 lg:order-1"> {/* Cost Cards */}
  <div className="w-full lg:w-3/5 flex flex-col order-1 lg:order-2"> {/* Chart */}
```

### 2. Grid System for Cost Cards
**File**: `components/pages/performance/USDTComparisonPage.tsx:229`

**Current**:
```tsx
<div className="grid grid-cols-3 gap-4 flex-1">
```

**Fix**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
```

### 3. Sidebar Navigation
**File**: `components/pages/performance/Page.tsx:498`

**Current**:
```tsx
<aside className="w-48 flex-shrink-0">
```

**Fix**:
```tsx
<aside className="hidden lg:block lg:w-48 lg:flex-shrink-0">
```

**Additional**: Add mobile drawer/hamburger menu for chain selection on mobile

### 4. Chart Responsive Margins
**File**: `components/pages/performance/USDTCostChart.tsx:91-94`

**Current**:
```tsx
const margin = { top: 30, right: 40, bottom: 70, left: 70 };
```

**Fix**: Add responsive margin function:
```tsx
const getResponsiveMargins = (width: number) => {
  if (width >= 1024) return { top: 30, right: 40, bottom: 70, left: 70 }; // Keep desktop unchanged
  if (width >= 640) return { top: 25, right: 30, bottom: 60, left: 60 };
  return { top: 20, right: 20, bottom: 50, left: 50 };
};
```

### 5. Performance Page Grid Layout
**File**: `components/pages/performance/Page.tsx:665`

**Current**:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
```

**Status**: ✅ Already responsive, but verify mobile experience

## 📱 Mobile-Specific Enhancements Needed

### USDTComparisonPage Mobile Layout
- **Chart Position**: Move chart above cards on mobile (order-1)
- **Card Grid**: Single column on mobile, 2 cols on tablet, 3 cols on desktop
- **Height**: Remove fixed height constraint on mobile
- **Text**: Ensure cost values and chain names don't overflow

### Performance Page Mobile Layout
- **Sidebar**: Hide sidebar, add mobile menu for chain selection
- **Metric Cards**: Ensure readable on small screens
- **Comparison Text**: Truncate long advantage text if needed

### Chart Responsiveness (Both Pages)
- **Font Sizes**: Scale down text for mobile
- **Touch Targets**: Ensure interactive elements are ≥44px
- **Axis Labels**: Rotate or abbreviate on mobile if needed
- **Legend**: Stack vertically on mobile

## 🔧 Implementation Plan

### Phase 1: Layout Structure (High Priority)
- [ ] Fix USDTComparisonPage flex layout with lg: breakpoints
- [ ] Fix grid system for cost cards
- [ ] Test on mobile device/browser dev tools

### Phase 2: Navigation (High Priority)
- [ ] Hide sidebar on mobile
- [ ] Implement mobile drawer for chain selection
- [ ] Add hamburger menu button

### Phase 3: Chart Optimization (Medium Priority)
- [ ] Implement responsive margins in USDTCostChart
- [ ] Test chart readability on mobile
- [ ] Adjust font sizes for mobile

### Phase 4: Polish (Low Priority)
- [ ] Fine-tune spacing and typography
- [ ] Test touch interactions
- [ ] Verify all animations work on mobile

## 🎯 Success Criteria

### Desktop (1024px+)
- ✅ Zero visual changes from current state
- ✅ All interactions work exactly as before
- ✅ Performance unchanged

### Tablet (640-1023px)
- [ ] Sidebar collapses to mobile menu
- [ ] Charts remain readable
- [ ] 2-column card grid works well

### Mobile (<640px)
- [ ] Stacked layout (chart above cards)
- [ ] Single column card grid
- [ ] All content accessible without horizontal scrolling
- [ ] Touch targets ≥44px

## 📋 Testing Checklist

### Devices to Test
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)
- [ ] 16" MacBook Pro (Desktop - should be unchanged)

### Browsers to Test
- [ ] Safari iOS
- [ ] Chrome iOS
- [ ] Chrome Android
- [ ] Brave Desktop (baseline)

### Functionality to Verify
- [ ] Chart interactions work on touch
- [ ] Chain selection works on mobile
- [ ] Tab switching works
- [ ] All tooltips accessible
- [ ] No horizontal scrolling
- [ ] Performance comparison cards readable
- [ ] Cost comparison cards readable

## 🚫 Do NOT Change
- Desktop layout proportions (w-2/5, w-3/5)
- Desktop sidebar width (w-48)
- Desktop chart height (h-[70vh])
- Desktop gap spacing (gap-12)
- Desktop grid columns (grid-cols-6, grid-cols-3)
- Desktop font sizes
- Desktop interactions
- Color schemes
- Animation timings

## 📝 Notes
- All changes should use Tailwind responsive prefixes (sm:, md:, lg:, xl:)
- Desktop breakpoint is lg: (1024px+)
- Test thoroughly on actual devices, not just browser dev tools
- Maintain accessibility standards
- Keep performance impact minimal