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

// Stablecoin colors
export const STABLECOIN_COLORS = createColorMap(
  [
    [['USDt'], '#90C0A0'], // green-200
    [['USDC'], '#90B8D9'], // blue-200
    [['USDe', 'sUSDe/USDe'], '#B0B0C0'], // gray-200
    [['sUSDe'], '#C0C0D0'], // gray-200
  ],
  '#B8BCC2'
);

// BTC-related token colors
export const BTC_COLORS = createColorMap(
  [
    [['xBTC'], '#333333'], // gray-800
    [['SBTC'], '#E6E6FA'], // purple-200
    [['aBTC'], '#FFB380'], // orange-200
    [['wBTC'], '#F7931A'], // orange-500
    [['tBTC'], '#627EEA'], // indigo-500
  ],
  '#D9DDE1'
);

// LST token colors
export const LST_COLORS = createColorMap(
  [
    [['thAPT', 'sthAPT', 'thAPT/sthAPT'], '#A873BB'], // purple-500
    [['amAPT', 'stAPT', 'amAPT/stAPT'], '#5D7F9E'], // blue-500
    [['kAPT', 'stkAPT', 'kAPT/stkAPT'], '#c8f08f'], // green-200
  ],
  '#7F56D9'
);

// RWA (Real World Assets) colors - Pastel palette with harmonious tones
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

// APR and yield related colors
export const YIELD_COLORS = {
  supplyAPR: '#10B981', // green-600
  rewardAPR: '#3B82F6', // blue-600
  borrowAPR: '#F97316', // orange-600
  totalAPR: '#047857', // green-700
  negative: '#EF4444', // red-600
  positive: '#16A34A', // green-600
  neutral: '#6B7280', // gray-500
};

// Protocol colors
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

// UI component colors
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
