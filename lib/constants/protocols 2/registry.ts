/**
 * Protocol Registry Re-exports
 * Re-exports from the main protocol registry for organized access
 */

export {
  PROTOCOLS,
  ProtocolType,
  type ProtocolInfo,
  getProtocolByAddress,
  getProtocolLabel,
  shouldShowProtocolBadge,
  isPhantomAsset,
  getPhantomReason,
  getProtocolsByType,
  getAllProtocolAddresses,
} from '../../protocol-registry';

/**
 * DeFi Protocol Name Mappings
 * Maps common protocol name variations to canonical names for better matching
 */
export const DEFI_PROTOCOL_NAME_MAPPINGS: Record<string, string> = {
  // Thala variations
  thala: 'Thala',
  'thala finance': 'Thala',
  'thala farm': 'Thala',

  // Pancake variations
  pancake: 'PancakeSwap',
  pancakeswap: 'PancakeSwap',
  'pancake swap': 'PancakeSwap',

  // Liquid staking variations
  amnis: 'Amnis',
  'amnis finance': 'Amnis',
  tortuga: 'Tortuga',
  'tortuga finance': 'Tortuga',

  // DEX variations
  liquidswap: 'LiquidSwap',
  'liquid swap': 'LiquidSwap',
  cellana: 'Cellana',
  'cellana finance': 'Cellana',
  sushi: 'SushiSwap',
  sushiswap: 'SushiSwap',
  'sushi swap': 'SushiSwap',

  // Aggregator variations
  panora: 'Panora',
  'panora exchange': 'Panora',
  kana: 'Kana',
  kanalabs: 'Kana',
  'kana labs': 'Kana',
  anqa: 'Anqa',

  // Lending variations
  aries: 'Aries Markets',
  'aries markets': 'Aries Markets',
  econia: 'Econia',

  // Other protocols
  aptin: 'Aptin Finance',
  'aptin finance': 'Aptin Finance',
  hippo: 'Hippo Labs',
  'hippo labs': 'Hippo Labs',
  aux: 'AUX',
  'aux exchange': 'AUX',
} as const;

/**
 * Utility function to normalize protocol names for better matching
 */
export const normalizeProtocolName = (protocolName: string): string => {
  const normalized = protocolName.toLowerCase().trim();
  return DEFI_PROTOCOL_NAME_MAPPINGS[normalized] || protocolName;
};
