/**
 * Combined Token Registry - for address to symbol lookups
 * Created separately to avoid circular dependencies
 */

import { NATIVE_TOKENS } from "../aptos/core";

import { LIQUID_STAKING_TOKENS } from "./lst";
import { STABLECOINS } from "./stablecoins";

export const TOKEN_REGISTRY = {
  ...NATIVE_TOKENS,
  ...STABLECOINS,
  ...LIQUID_STAKING_TOKENS,
} as const;
