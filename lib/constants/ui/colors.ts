/**
 * UI Color Configuration
 * Centralized color definitions for consistent theming
 */

type TokenColorMap = Record<string, string>;

/**
 * Base color palette - eliminates duplicate HSL values
 */
const BASE_COLORS = {
  // Gray variations
  gray200: "hsl(210, 17%, 90%)",
  gray300: "hsl(210, 14%, 83%)",
  gray400: "hsl(218, 11%, 65%)",
  gray500: "hsl(220, 9%, 46%)",
  gray600: "hsl(215, 16%, 34%)",

  // Blue variations
  blue200: "hsl(213, 92%, 87%)",
  blue300: "hsl(213, 94%, 78%)",
  blue100: "hsl(214, 95%, 93%)",

  // Purple variations
  purple200: "hsl(271, 100%, 92%)",
  purple300: "hsl(270, 91%, 85%)",
  purple400: "hsl(271, 91%, 75%)",
  purple500: "hsl(270, 91%, 65%)",

  // Green variations
  green100: "hsl(138, 76%, 90%)",
  green200: "hsl(141, 78%, 85%)",
  green300: "hsl(142, 76%, 74%)",

  // Other colors
  indigo200: "hsl(226, 94%, 89%)",
  indigo300: "hsl(233, 75%, 80%)",
  orange200: "hsl(31, 97%, 83%)",
  emerald300: "hsl(160, 60%, 67%)",
  amber300: "hsl(46, 96%, 64%)",
  sky300: "hsl(199, 92%, 74%)",
  yellow200: "hsl(48, 95%, 76%)",
  red200: "hsl(0, 90%, 89%)",
  violet200: "hsl(252, 87%, 91%)",
  echoOrange: "hsl(16, 100%, 70%)",

  // Yield and protocol colors
  green600: "hsl(142, 71%, 45%)",
  green700: "hsl(160, 84%, 39%)",
  blue500: "hsl(217, 91%, 60%)",
  orange600: "hsl(25, 95%, 53%)",
  red600: "hsl(0, 84%, 60%)",
  green600Dark: "hsl(142, 76%, 36%)",
  teal500: "hsl(176, 62%, 51%)",
  violet500: "hsl(258, 89%, 66%)",
  amber500: "hsl(38, 92%, 50%)",
  pink500: "hsl(329, 86%, 70%)",
  teal400: "hsl(170, 66%, 50%)",
  sky500: "hsl(199, 89%, 48%)",
  sky700: "hsl(201, 79%, 40%)",
} as const;

/**
 * Helper function to create color maps from token arrays
 */
const createColorMap = (
  entries: [string[], string][],
  defaultColor: string,
): TokenColorMap => {
  const map: TokenColorMap = { default: defaultColor };
  for (const [tokens, color] of entries) {
    tokens.forEach((token) => {
      map[token] = color;
    });
  }
  return map;
};

/**
 * Stablecoin colors - Using HSL for consistency
 */
export const STABLECOIN_COLORS = createColorMap(
  [
    // Native USDT - darker pastel green
    [["USDT"], BASE_COLORS.green300], // green-300

    // Native USDC - darker pastel blue
    [["USDC"], BASE_COLORS.blue300], // blue-300

    // Bridged USDT variants - darker pastel mint greens
    [["lzUSDT"], BASE_COLORS.green200], // green-200
    [["whUSDT"], BASE_COLORS.green100], // green-100
    [["ceUSDT"], BASE_COLORS.emerald300], // emerald-300

    // Bridged USDC variants - darker pastel sky blues
    [["lzUSDC"], BASE_COLORS.blue200], // blue-200
    [["whUSDC"], BASE_COLORS.blue100], // blue-100
    [["ceUSDC"], BASE_COLORS.indigo300], // indigo-300

    // Ethena - darker pastel grays
    [["USDe", "sUSDe/USDe"], BASE_COLORS.gray300], // gray-300
    [["sUSDe"], BASE_COLORS.gray200], // gray-200

    // Mirage mUSD - darker pastel orange
    [["mUSD"], BASE_COLORS.amber300], // amber-300

    // MOD - darker pastel purple
    [["MOD"], BASE_COLORS.purple300], // purple-300
  ],
  BASE_COLORS.gray300,
);

/**
 * BTC-related token colors - Using HSL for consistency
 */
export const BTC_COLORS = createColorMap(
  [
    [["xBTC"], BASE_COLORS.gray400], // Gray (gray-400)
    [["SBTC"], BASE_COLORS.gray600], // Muted black (gray-600)
    [["WBTC"], BASE_COLORS.orange200], // Pastel muted orange (orange-200)
    [["aBTC"], BASE_COLORS.echoOrange], // Pastel Echo Protocol orange
    [["wBTC"], BASE_COLORS.orange200], // Pastel muted orange (orange-200)
    [["tBTC"], BASE_COLORS.indigo300], // Pastel indigo (indigo-300)
  ],
  BASE_COLORS.gray200, // Pastel gray (gray-200)
);

/**
 * LST (Liquid Staking Token) colors - Using HSL for consistency
 */
export const LST_COLORS = createColorMap(
  [
    // Amnis tokens - Soft pastel blue tones
    [
      ["stAPT", "amAPT", "amAPT / stAPT", "amAPT/stAPT", "Amnis"],
      BASE_COLORS.blue300,
    ], // blue-300

    // Thala tokens - Darker purple tones
    [
      [
        "thAPT",
        "sthAPT",
        "thAPT / sthAPT",
        "sthAPT / thAPT",
        "thAPT/sthAPT",
        "sthAPT/thAPT",
        "Thala",
      ],
      BASE_COLORS.purple500,
    ], // purple-500

    // Kofi tokens - Soft pastel green tones
    [
      ["kAPT", "stkAPT", "kAPT / stkAPT", "kAPT/stkAPT", "Kofi"],
      BASE_COLORS.green300,
    ], // green-300

    // Trustake/Turfin tokens - Soft pastel gray tones
    [["truAPT", "Trustake", "turAPT", "Turfin"], BASE_COLORS.gray300], // gray-300
  ],
  BASE_COLORS.gray300, // gray-300
);

/**
 * RWA (Real World Assets) colors - Using HSL for consistency
 */
export const RWA_COLORS = createColorMap(
  [
    // BlackRock - Blackish/dark gray pastels
    [["BUIDL"], BASE_COLORS.gray500], // gray-500

    // Franklin Templeton - Soft green pastels
    [["BENJI"], BASE_COLORS.green300], // green-300

    // Ondo Finance - Soft teal pastels
    [["USDY"], BASE_COLORS.sky300], // sky-300

    // Libre Capital - Warm pastel oranges
    [["UMA"], BASE_COLORS.orange200], // orange-200
    [["BHMA"], BASE_COLORS.yellow200], // yellow-200
    [["HLSPCA"], BASE_COLORS.red200], // red-200

    // Apollo/Securitize - Soft blue pastels
    [["ACRED"], BASE_COLORS.indigo300], // indigo-300

    // PACT Protocol - Purplish pastels
    [["BSFG-EM-1"], BASE_COLORS.purple400], // purple-400
    [["BSFG-CAD-1"], BASE_COLORS.purple300], // purple-300
    [["BSFG-KES-1"], BASE_COLORS.purple200], // purple-200
    [["BSFG-AD-1"], BASE_COLORS.violet200], // violet-200
  ],
  BASE_COLORS.indigo200, // indigo-200
);

/**
 * Token category colors for portfolio allocation
 */
export const TOKEN_CATEGORY_COLORS: Record<string, string> = {
  Stablecoins: BASE_COLORS.green300, // #22c55e equivalent
  LSTs: BASE_COLORS.purple500, // #8b5cf6 equivalent
  DeFi: BASE_COLORS.blue300, // #3b82f6 equivalent
  Other: BASE_COLORS.gray400, // #6b7280 equivalent
} as const;

/**
 * APR and yield related colors - Using CSS custom properties where available
 */
export const YIELD_COLORS = {
  supplyAPR: BASE_COLORS.green600, // green-600 equivalent
  rewardAPR: BASE_COLORS.blue500, // blue-600 equivalent
  borrowAPR: BASE_COLORS.orange600, // orange-600 equivalent
  totalAPR: BASE_COLORS.green700, // green-700 equivalent
  negative: BASE_COLORS.red600, // red-600 equivalent
  positive: BASE_COLORS.green600Dark, // green-600 darker
  neutral: BASE_COLORS.gray500, // gray-500 equivalent
};

/**
 * Protocol colors - Brand-specific colors in HSL
 */
export const PROTOCOL_COLORS = {
  echelon: BASE_COLORS.teal500, // teal/aqua
  echo: BASE_COLORS.violet500, // violet-500
  axelar: BASE_COLORS.amber500, // amber-500
  debridge: BASE_COLORS.pink500, // pink-500
  wormhole: BASE_COLORS.teal400, // teal-400
  pontem: BASE_COLORS.sky500, // sky-500
  aries: BASE_COLORS.sky700, // sky-700
  liquidswap: BASE_COLORS.blue500, // blue-500
};

/**
 * Transaction category colors - Using Tailwind utility classes
 * These remain as Tailwind classes since they're complex combinations
 */
export const CATEGORY_COLORS = {
  // DeFi activities
  swap: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  liquidity:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700",
  staking:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700",
  rewards:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",

  // Transfer activities
  received:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  sent: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700",

  // Other activities
  bridge:
    "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700",
  cex: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700",
  nft: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700",
  rwa: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700",
  system:
    "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600",
  other:
    "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600",

  // Default fallback
  default: "bg-muted text-muted-foreground border-border",
};

/**
 * UI component colors - References CSS variables for consistency
 */
export const UI_COLORS = {
  cardBackground: "bg-card",
  dialogBackground: "bg-card",
  lowEmphasis: "text-muted-foreground",
  highEmphasis: "text-foreground",
  accent: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
};
