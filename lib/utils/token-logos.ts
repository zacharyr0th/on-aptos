/**
 * Utility functions for mapping token addresses to logo URLs from the Aptos-Tokens repository
 */

// Base URL for the Aptos-Tokens repository logos
const APTOS_TOKENS_LOGO_BASE_URL = 'https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos';

// Common token symbol to logo mapping
const TOKEN_LOGO_MAP: Record<string, string> = {
  // Core tokens
  'APT': 'APT.svg',
  'USDC': 'USDC.png',
  'USDT': 'USDT.png',
  'WETH': 'WETH.png',
  'WBTC': 'WBTC.png',
  'DAI': 'DAI.png',
  'BUSD': 'BUSD.png',
  
  // DeFi tokens
  'CAKE': 'CAKE.png',
  'GUI': 'GUI.png',
  'HIPPO': 'HIPPO.png',
  'MOVE': 'MOVE.png',
  'ABEL': 'ABEL.svg',
  'ACAT': 'ACAT.png',
  'ACRED': 'ACRED.png',
  'AGLP': 'AGLP.png',
  'ALI': 'ALI.png',
  'ALT': 'ALT.png',
  'AMA': 'AMA.png',
  'AMNIS': 'AMNIS.png',
  'ANIMESWAP': 'ANIMESWAP.png',
  'APF': 'APF.png',
  'APTOGE': 'APTOGE.png',
  'AQUA': 'AQUA.png',
  'ARCO': 'ARCO.png',
  'ARIES': 'ARIES.png',
  'ASSUME': 'ASSUME.png',
  'AVOCADO': 'AVOCADO.png',
  'BLUEBERRY': 'BLUEBERRY.png',
  'BONKAPES': 'BONKAPES.png',
  'CELER': 'CELER.png',
  'CHILLGUY': 'CHILLGUY.png',
  'CHLOE': 'CHLOE.png',
  'DITTO': 'DITTO.png',
  'FOMO': 'FOMO.png',
  'GUMMY': 'GUMMY.png',
  'HONEY': 'HONEY.png',
  'LZUSDC': 'LZUSDC.png',
  'LZUSDT': 'LZUSDT.png',
  'MEMES': 'MEMES.png',
  'MOJITO': 'MOJITO.png',
  'MOON': 'MOON.png',
  'PEPE': 'PEPE.png',
  'SFRXETH': 'SFRXETH.png',
  'SOUFFL3': 'SOUFFL3.png',
  'STSUI': 'STSUI.png',
  'TAPOS': 'TAPOS.png',
  'TGUI': 'TGUI.png',
  'THALA': 'THALA.png',
  'TORTUGA': 'TORTUGA.png',
  'USDY': 'USDY.png',
  'WORMHOLE': 'WORMHOLE.png',
  'XBTC': 'XBTC.png',
  'XETH': 'XETH.png',
  'XUSDC': 'XUSDC.png',
  'XUSDT': 'XUSDT.png',
  'ZBTC': 'ZBTC.png',
  'ZETH': 'ZETH.png',
  'ZUSDC': 'ZUSDC.png',
  'ZUSDT': 'ZUSDT.png',
};

/**
 * Extracts the token symbol from an asset type or metadata
 */
export function getTokenSymbol(assetType: string, metadata?: any): string | null {
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
 * Gets the logo URL for a token from the Aptos-Tokens repository
 */
export function getTokenLogoUrl(assetType: string, metadata?: any): string | null {
  const symbol = getTokenSymbol(assetType, metadata);
  
  if (!symbol) {
    return null;
  }
  
  // Check if we have a mapping for this token
  const logoFile = TOKEN_LOGO_MAP[symbol];
  if (logoFile) {
    return `${APTOS_TOKENS_LOGO_BASE_URL}/${logoFile}`;
  }
  
  // Try common variations
  const commonExtensions = ['png', 'svg', 'jpg', 'jpeg'];
  for (const ext of commonExtensions) {
    // This will attempt to load the logo, but we'll handle the fallback in the component
    return `${APTOS_TOKENS_LOGO_BASE_URL}/${symbol}.${ext}`;
  }
  
  return null;
}

/**
 * Gets the logo URL with a fallback to the existing metadata icon_uri
 */
export function getTokenLogoUrlWithFallback(assetType: string, metadata?: any): string {
  const aptosTokensLogo = getTokenLogoUrl(assetType, metadata);
  
  if (aptosTokensLogo) {
    return aptosTokensLogo;
  }
  
  // Fallback to existing metadata icon_uri
  if (metadata?.icon_uri) {
    return metadata.icon_uri;
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