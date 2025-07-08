/**
 * Utility functions for mapping token addresses to logo URLs from the Aptos-Tokens repository
 */

// Base URL for the Aptos-Tokens repository logos
const APTOS_TOKENS_LOGO_BASE_URL =
  'https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos';

// Common token symbol to logo mapping
const TOKEN_LOGO_MAP: Record<string, string> = {
  // Core tokens
  APT: 'APT.svg',
  USDC: 'USDC.png',
  USDT: 'USDT.png',
  WETH: 'WETH.png',
  WBTC: 'WBTC.png',
  DAI: 'DAI.png',
  BUSD: 'BUSD.png',

  // DeFi tokens
  CAKE: 'CAKE.png',
  GUI: 'GUI.png',
  HIPPO: 'HIPPO.png',
  MOVE: 'MOVE.png',
  ABEL: 'ABEL.svg',
  ACAT: 'ACAT.png',
  ACRED: 'ACRED.png',
  AGLP: 'AGLP.png',
  ALI: 'ALI.png',
  ALT: 'ALT.png',
  AMA: 'AMA.png',
  AMNIS: 'AMNIS.png',
  ANIMESWAP: 'ANIMESWAP.png',
  APF: 'APF.png',
  APTOGE: 'APTOGE.png',
  AQUA: 'AQUA.png',
  ARCO: 'ARCO.png',
  ARIES: 'ARIES.png',
  ASSUME: 'ASSUME.png',
  AVOCADO: 'AVOCADO.png',
  BLUEBERRY: 'BLUEBERRY.png',
  BONKAPES: 'BONKAPES.png',
  CELER: 'CELER.png',
  CHILLGUY: 'CHILLGUY.png',
  CHLOE: 'CHLOE.png',
  DITTO: 'DITTO.png',
  FOMO: 'FOMO.png',
  GUMMY: 'GUMMY.png',
  HONEY: 'HONEY.png',
  LZUSDC: 'LZUSDC.png',
  LZUSDT: 'LZUSDT.png',
  MEMES: 'MEMES.png',
  MOJITO: 'MOJITO.png',
  MOON: 'MOON.png',
  PEPE: 'PEPE.png',
  SFRXETH: 'SFRXETH.png',
  SOUFFL3: 'SOUFFL3.png',
  STSUI: 'STSUI.png',
  TAPOS: 'TAPOS.png',
  TGUI: 'TGUI.png',
  THALA: 'THALA.png',
  TORTUGA: 'TORTUGA.png',
  USDY: 'USDY.png',
  WORMHOLE: 'WORMHOLE.png',
  XBTC: 'XBTC.png',
  XETH: 'XETH.png',
  XUSDC: 'XUSDC.png',
  XUSDT: 'XUSDT.png',
  ZBTC: 'ZBTC.png',
  ZETH: 'ZETH.png',
  ZUSDC: 'ZUSDC.png',
  ZUSDT: 'ZUSDT.png',
};

/**
 * Extracts the token symbol from an asset type or metadata
 */
export function getTokenSymbol(
  assetType: string,
  metadata?: any
): string | null {
  // Try to get symbol from metadata first
  if (metadata?.symbol) {
    return metadata.symbol.toUpperCase();
  }

  // Extract symbol from asset type
  // Asset types are typically in format: 0x...::coin::TokenName
  const parts = assetType.split('::');
  if (parts.length >= 3) {
    const tokenName = parts[parts.length - 1];
    return tokenName.toUpperCase();
  }

  // Handle special cases like 0x1::aptos_coin::AptosCoin
  if (assetType.includes('aptos_coin')) {
    return 'APT';
  }

  return null;
}

/**
 * Gets the logo URL for a token using local assets
 */
export function getTokenLogoUrl(
  assetType: string,
  metadata?: any
): string | null {
  const symbol = getTokenSymbol(assetType, metadata);

  if (!symbol) {
    return null;
  }

  // Map to local icon files based on symbol
  const symbolLower = symbol.toLowerCase();

  if (symbolLower === 'apt' || symbolLower === 'aptos') {
    return '/icons/apt.png';
  } else if (symbolLower === 'usdc') {
    return '/icons/stables/usdc.png';
  } else if (symbolLower === 'usdt') {
    return '/icons/stables/usdt.png';
  } else if (symbolLower === 'wbtc' || symbolLower === 'btc') {
    return '/icons/btc/bitcoin.png';
  } else if (symbolLower === 'stapt' || symbolLower === 'st-apt') {
    return '/icons/lst/amnis-stAPT.jpeg';
  } else if (symbolLower === 'amnis' || symbolLower === 'amapt') {
    return '/icons/protocols/amnis.avif';
  } else if (symbolLower === 'thapt' || symbolLower === 'th-apt') {
    return '/icons/lst/thala-thAPT.png';
  }

  // Return null to trigger fallback to placeholder
  return null;
}

/**
 * Gets the logo URL with a fallback to the existing metadata icon_uri
 */
export function getTokenLogoUrlWithFallback(
  assetType: string,
  metadata?: any
): string {
  // First try metadata icon_uri (which might have Panora URL)
  if (metadata?.icon_uri) {
    return metadata.icon_uri;
  }

  // Then try local mapping
  const localLogo = getTokenLogoUrl(assetType, metadata);
  if (localLogo) {
    return localLogo;
  }

  // Try to construct Panora GitHub URL as fallback
  const symbol = getTokenSymbol(assetType, metadata);
  if (symbol) {
    // Try SVG first as many Panora tokens use SVG
    return `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${symbol}.svg`;
  }

  // Final fallback to placeholder
  return '/placeholder.jpg';
}

/**
 * Checks if a token has a logo available in the Aptos-Tokens repository
 */
export function hasTokenLogo(assetType: string, metadata?: any): boolean {
  const symbol = getTokenSymbol(assetType, metadata);
  return symbol ? TOKEN_LOGO_MAP[symbol] !== undefined : false;
}

/**
 * Gets all available token symbols that have logos
 */
export function getAvailableTokenSymbols(): string[] {
  return Object.keys(TOKEN_LOGO_MAP);
}
