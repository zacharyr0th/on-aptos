/**
 * Liquid staking tokens and their derivatives
 * Central source of truth for all LST tokens
 */

import { PROTOCOLS } from "@/lib/constants/protocols/protocol-registry";

/**
 * Liquid staking protocol addresses
 * References the centralized protocol registry
 */
export const LIQUID_STAKING_PROTOCOLS = {
  THALA: PROTOCOLS.THALA_LSD.addresses[0],
  AMNIS: PROTOCOLS.AMNIS_FINANCE.addresses[0],
  TRUFIN: PROTOCOLS.TRUFIN.addresses[0],
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
 * Includes both coin and FA addresses
 */
export const LIQUID_STAKING_TOKEN_SET = new Set<string>([
  // Amnis tokens
  LST_TOKEN_ADDRESSES.AMNIS.STAPT.coin,
  LST_TOKEN_ADDRESSES.AMNIS.STAPT.fa,
  LST_TOKEN_ADDRESSES.AMNIS.AMAPT.coin,
  LST_TOKEN_ADDRESSES.AMNIS.AMAPT.fa,

  // Thala tokens
  LST_TOKEN_ADDRESSES.THALA.THAPT.coin,
  LST_TOKEN_ADDRESSES.THALA.THAPT.fa,
  LST_TOKEN_ADDRESSES.THALA.STHAPT.coin,
  LST_TOKEN_ADDRESSES.THALA.STHAPT.fa,

  // Kofi tokens
  LST_TOKEN_ADDRESSES.KOFI.KAPT.fa,
  LST_TOKEN_ADDRESSES.KOFI.STKAPT.fa,

  // Protocol addresses
  ...Object.values(LIQUID_STAKING_PROTOCOLS),
]);
