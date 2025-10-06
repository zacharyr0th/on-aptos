/**
 * Protocol logo mapping - Comprehensive coverage for all protocols
 * Centralized location for protocol logo URLs
 */

export const getProtocolLogo = (protocol: string): string => {
  const protocolName = protocol.toLowerCase();
  const logoMap: Record<string, string> = {
    // Core Aptos Infrastructure
    "aptos framework": "/icons/apt.png",
    "digital assets": "/icons/apt.png",
    "aptos token v2": "/icons/apt.png",

    // Liquid Staking Protocols
    amnis: "/icons/protocols/amnis.avif",
    "amnis finance": "/icons/protocols/amnis.avif",
    "thala liquid staking": "/icons/protocols/thala.avif",
    trufin: "/icons/protocols/trufin.webp",

    // Lending Protocols
    aries: "/icons/protocols/aries.avif",
    "aries markets": "/icons/protocols/aries.avif",
    echelon: "/icons/protocols/echelon.avif",
    "echelon market": "/icons/protocols/echelon.avif",
    echo: "/icons/protocols/echo.webp",
    "echo lending": "/icons/protocols/echo.webp",
    meso: "/icons/protocols/meso.webp",
    "meso finance": "/icons/protocols/meso.webp",
    joule: "/icons/protocols/joule.webp",
    "joule finance": "/icons/protocols/joule.webp",
    superposition: "/icons/protocols/superposition.webp",
    aave: "/placeholder.jpg",
    "thala cdp": "/icons/protocols/thala.avif",

    // DEX Protocols
    liquidswap: "/icons/protocols/liquidswap.webp",
    pancakeswap: "/icons/protocols/pancake.webp",
    pancake: "/icons/protocols/pancake.webp",
    sushi: "/icons/protocols/sushi.webp",
    sushiswap: "/icons/protocols/sushi.webp",
    cellana: "/icons/protocols/cellana.webp",
    "cellana finance": "/icons/protocols/cellana.webp",
    panora: "/icons/protocols/panora.webp",
    "panora exchange": "/icons/protocols/panora.webp",
    kana: "/icons/protocols/kana.webp",
    kanalabs: "/icons/protocols/kana.webp",
    hyperion: "/icons/protocols/hyperion.webp",
    vibrantx: "/icons/protocols/vibrantx.png",
    "uptos pump": "/icons/protocols/pump-uptos.jpg",
    "pump-uptos": "/icons/protocols/pump-uptos.jpg",
    defy: "/placeholder.jpg",
    "lucid finance": "/placeholder.jpg",
    "pact labs": "/placeholder.jpg",
    thetis: "/icons/protocols/thetis.webp",
    "thetis market": "/icons/protocols/thetis.webp",

    // Derivatives & Trading
    merkle: "/icons/protocols/merkle.webp",
    "merkle trade": "/icons/protocols/merkle.webp",

    // Farming Protocols
    thala: "/icons/protocols/thala.avif",
    "thala farm": "/icons/protocols/thala.avif",
    "thala infrastructure": "/icons/protocols/thala.avif",

    // Bridge Protocols
    layerzero: "/placeholder.jpg",
    wormhole: "/placeholder.jpg",
    celer: "/placeholder.jpg",
    "celer bridge": "/placeholder.jpg",

    // Other Protocols
    agdex: "/icons/protocols/agdex.webp",
    anqa: "/icons/protocols/anqa.webp",
    ichi: "/icons/protocols/ichi.jpg",
    metamove: "/icons/protocols/metamove.png",
    moar: "/icons/protocols/moar.webp",
    tapp: "/icons/protocols/tapp.webp",
    crossmint: "/icons/protocols/crossmint.jpeg",
    eliza: "/icons/protocols/eliza.jpeg",
    tradeport: "/icons/protocols/tradeport.jpg",

    // Stablecoin Protocols
    usdc: "/icons/protocols/usdc.avif",
    usde: "/icons/protocols/usde.avif",
    usdt: "/icons/protocols/usdt.avif",

    // Additional protocol variations and aliases
    kofi: "/icons/protocols/kofi.avif",
    trustake: "/icons/apt.png",
    "sushi finance": "/icons/protocols/sushi.webp",
    "pancake finance": "/icons/protocols/pancake.webp",
    "liquid swap": "/icons/protocols/liquidswap.webp",
    "merkle finance": "/icons/protocols/merkle.webp",
  };

  return logoMap[protocolName] || "/placeholder.jpg";
};
