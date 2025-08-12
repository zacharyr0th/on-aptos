/**
 * Liquid staking tokens and their derivatives
 * These should be shown separately from regular tokens
 * Moved from aptos-constants.ts
 */

/**
 * Liquid staking tokens and their derivatives
 */
export const LIQUID_STAKING_TOKENS = {
  // Thala
  THAPT: "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6",

  // Amnis
  AMAPT: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a",
  STAPT:
    "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt",
  VSTAPT:
    "0x3c1d4a86594d681ff7e5d5a233965daeabdc6a15fe5672ceeda5260038857183::vcoins::V<0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt>",

  // Tortuga
  TAPT: "0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin",

  // TruFin
  TRUFIN: "0x6f8ca77dd0a4c65362f475adb1c26ae921b1d75aa6b70e53d0e340efd7d8bc80",

  // Vested/Locked APT variants
  VAPT: "0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896::vcoins::V<0x1::aptos_coin::AptosCoin>",
} as const;

/**
 * LST Token Addresses - Both coin and FA versions
 * Comprehensive mapping of all LST tokens and their fungible asset counterparts
 */
export const LST_TOKEN_ADDRESSES = {
  // Amnis tokens
  AMNIS: {
    // stAPT - Staked APT
    STAPT: {
      coin: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt",
      fa: "0xf0995d360365bad80f9129f32c18bb7e636ed45a5ad96127be7e8e7f033e2ac9",
    },
    // amAPT - Auto-compounding APT
    AMAPT: {
      coin: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
      fa: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a",
    },
  },

  // Thala tokens
  THALA: {
    // thAPT - Thala APT
    THAPT: {
      coin: "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
      fa: "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6",
    },
    // sthAPT - Staked Thala APT
    STHAPT: {
      coin: "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::sthAPT",
      fa: "0xb854b0367a3c0a014dfb3b4630ad06f8c2cbebd6c87b6b13b4c2b2ca88e0faa3",
    },
  },

  // Kofi tokens (FA only)
  KOFI: {
    // kAPT - Kofi APT
    KAPT: {
      fa: "0x24c75c96c7b9e6db4fa9a087f60c10bff19c49e96fb5bc0cf7b46b97ae685f49",
    },
    // stkAPT - Staked Kofi APT
    STKAPT: {
      fa: "0x47c99173e2e2f5528ac6f0cf4ba7c7de0ab2b65b9f2e15fb672ac0933faa0b9b",
    },
  },
} as const;

/**
 * Set of all liquid staking tokens for O(1) lookup
 */
export const LIQUID_STAKING_TOKEN_SET = new Set(
  Object.values(LIQUID_STAKING_TOKENS),
) as Set<string>;
