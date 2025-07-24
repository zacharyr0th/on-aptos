/**
 * UI Color Configuration
 * Centralized color definitions for consistent theming
 */

type TokenColorMap = Record<string, string>;

const createColorMap = (
  entries: [string[], string][],
  defaultColor: string
): TokenColorMap => {
  const map: TokenColorMap = { default: defaultColor };
  for (const [tokens, color] of entries) {
    tokens.forEach(token => {
      map[token] = color;
    });
  }
  return map;
};

/**
 * Stablecoin colors - slightly darker pastel colors for each stablecoin type
 */
export const STABLECOIN_COLORS = createColorMap(
  [
    // Native USDT - darker pastel green
    [['USDT'], '#86efac'], // green-300

    // Native USDC - darker pastel blue
    [['USDC'], '#93c5fd'], // blue-300

    // Bridged USDT variants - darker pastel mint greens
    [['lzUSDT'], '#bbf7d0'], // green-200
    [['whUSDT'], '#d1fae5'], // green-100
    [['ceUSDT'], '#6ee7b7'], // emerald-300

    // Bridged USDC variants - darker pastel sky blues
    [['lzUSDC'], '#bfdbfe'], // blue-200
    [['whUSDC'], '#dbeafe'], // blue-100
    [['ceUSDC'], '#a5b4fc'], // indigo-300

    // Ethena - darker pastel grays
    [['USDe', 'sUSDe/USDe'], '#d1d5db'], // gray-300
    [['sUSDe'], '#e5e7eb'], // gray-200

    // Mirage mUSD - darker pastel orange
    [['mUSD'], '#fcd34d'], // amber-300

    // MOD - darker pastel purple
    [['MOD'], '#d8b4fe'], // purple-300
  ],
  '#d1d5db'
);

/**
 * BTC-related token colors
 */
export const BTC_COLORS = createColorMap(
  [
    [['xBTC'], '#9ca3af'], // Gray (gray-400)
    [['SBTC'], '#4b5563'], // Muted black (gray-600)
    [['WBTC'], '#fed7aa'], // Pastel muted orange (orange-200)
    [['aBTC'], '#ff8a65'], // Pastel Echo Protocol orange
    [['wBTC'], '#fed7aa'], // Pastel muted orange (orange-200) - keeping for backwards compatibility
    [['tBTC'], '#a5b4fc'], // Pastel indigo (indigo-300)
  ],
  '#e5e7eb' // Pastel gray (gray-200)
);


/**
 * RWA (Real World Assets) colors - Pastel palette with harmonious tones
 */
export const RWA_COLORS = createColorMap(
  [
    // BlackRock - Blackish/dark gray pastels
    [['BUIDL'], '#6b7280'], // gray-500 (blackish but visible)

    // Franklin Templeton - Soft green pastels
    [['BENJI'], '#86efac'], // green-300

    // Ondo Finance - Soft teal pastels
    [['USDY'], '#7dd3fc'], // sky-300

    // Libre Capital - Warm pastel oranges
    [['UMA'], '#fed7aa'], // orange-200
    [['BHMA'], '#fde68a'], // yellow-200
    [['HLSPCA'], '#fecaca'], // red-200

    // Apollo/Securitize - Soft blue pastels
    [['ACRED'], '#a5b4fc'], // indigo-300

    // PACT Protocol - Purplish pastels
    [['BSFG-EM-1'], '#c084fc'], // purple-400
    [['BSFG-CAD-1'], '#d8b4fe'], // purple-300
    [['BSFG-KES-1'], '#e9d5ff'], // purple-200
    [['BSFG-AD-1'], '#ddd6fe'], // violet-200
  ],
  '#c7d2fe' // indigo-200 (soft pastel default)
);

/**
 * APR and yield related colors
 */
export const YIELD_COLORS = {
  supplyAPR: '#10B981', // green-600
  rewardAPR: '#3B82F6', // blue-600
  borrowAPR: '#F97316', // orange-600
  totalAPR: '#047857', // green-700
  negative: '#EF4444', // red-600
  positive: '#16A34A', // green-600
  neutral: '#6B7280', // gray-500
};

/**
 * Protocol colors
 */
export const PROTOCOL_COLORS = {
  echelon: '#30D5C8', // updated to match teal/aqua color from the logo
  echo: '#8B5CF6', // violet-500, matches the purple in the chart
  axelar: '#F59E0B', // amber-500
  debridge: '#EC4899', // pink-500
  wormhole: '#2DD4BF', // teal-400
  pontem: '#0EA5E9', // sky-500
  tortuga: '#8B5CF6', // violet-500
  aries: '#0284C7', // sky-700
  liquidswap: '#3B82F6', // blue-500
};

/**
 * Portfolio distribution chart colors
 */
export const PORTFOLIO_CHART_COLORS = {
  // Category colors (inner circle)
  categories: {
    tokens: 'hsl(200, 70%, 85%)', // Light blue
    defi: 'hsl(280, 60%, 85%)', // Light purple
    nfts: 'hsl(50, 80%, 85%)', // Light yellow
  },

  // Asset colors (outer circle) - progressively darker shades
  tokens: {
    primary: 'hsl(200, 70%, 75%)', // APT
    secondary: 'hsl(200, 70%, 65%)', // USDC
    tertiary: 'hsl(200, 70%, 55%)', // wBTC
    quaternary: 'hsl(200, 70%, 45%)', // USDT
    quinary: 'hsl(200, 70%, 35%)', // wETH
  },

  defi: {
    primary: 'hsl(280, 60%, 75%)', // Thala LP
    secondary: 'hsl(280, 60%, 65%)', // Amnis stAPT
    tertiary: 'hsl(280, 60%, 55%)', // Pancake LP
    quaternary: 'hsl(280, 60%, 45%)', // Tortuga stAPT
    quinary: 'hsl(280, 60%, 35%)', // Ditto stAPT
    senary: 'hsl(280, 60%, 25%)', // Aries Markets
  },

  nfts: {
    primary: 'hsl(50, 80%, 75%)', // Aptos Monkeys
    secondary: 'hsl(50, 80%, 65%)', // Aptomingos
    tertiary: 'hsl(50, 80%, 55%)', // Topaz Troopers
    quaternary: 'hsl(50, 80%, 45%)', // Souffl3 NFTs
    quinary: 'hsl(50, 80%, 35%)', // Other NFTs
  },
};

/**
 * UI component colors
 */
export const UI_COLORS = {
  cardBackground: 'bg-card',
  dialogBackground: 'bg-card',
  lowEmphasis: 'text-muted-foreground',
  highEmphasis: 'text-foreground',
  accent: 'bg-primary/10 text-primary',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800',
  info: 'bg-blue-100 text-blue-800',
};
