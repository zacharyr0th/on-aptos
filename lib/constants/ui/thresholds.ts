/**
 * UI Display Thresholds and Limits
 * Configuration for display cutoffs and filtering
 */

export const DISPLAY_THRESHOLDS = {
  MIN_BALANCE_DISPLAY: 0.00001,
  MIN_VALUE_USD: 0.01,
  PHANTOM_DETECTION_MIN_VALUE: 1,
} as const;

export const PROTOCOL_TYPES = {
  DEX: 'DEX',
  LENDING: 'Lending',
  LIQUID_STAKING: 'Liquid Staking',
  STABLECOIN: 'Stablecoin',
  BRIDGE: 'Bridge',
  ORACLE: 'Oracle',
} as const;
