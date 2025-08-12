/**
 * Yield service constants - protocol addresses and token mappings
 * Moved from lib/services/yield/constants.ts
 */

/**
 * Common protocol addresses on Aptos
 */
export const YIELD_PROTOCOL_ADDRESSES = {
  // Lending
  ARIES: "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3",
  ECHELON: "0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba",
  ECHO: "0x2ee27d0f9958de7c4c690f7a37a893f1e86ffc0a90e5e6d8a479f25e4f90c85f",
  MESO: "0x5a466cad1f95e4e90e8e3d6f5c6e5d5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f", // Placeholder

  // DEX
  THALA: "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af",
  LIQUIDSWAP:
    "0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948",
  PANCAKESWAP:
    "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e", // V1
  SUSHISWAP:
    "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c",

  // LST
  TORTUGA: "0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114",
  AMNIS: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a",

  // Farming/Yield
  THALA_FARM:
    "0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99",

  // CDP/Stablecoin
  THALA_CDP:
    "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01",
} as const;

/**
 * Common token addresses on Aptos
 */
export const YIELD_TOKEN_ADDRESSES = {
  APT: "0x1::aptos_coin::AptosCoin",
  USDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
  USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  WETH: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH",
  WBTC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC",
  DAI: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::DAI",

  // Protocol tokens
  THL: "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
  MOD: "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
  CAKE: "0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT",

  // LST tokens
  thAPT:
    "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
  stAPT:
    "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
  tAPT: "0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin",
} as const;
