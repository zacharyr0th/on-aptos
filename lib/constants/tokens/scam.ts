/**
 * Known scam token addresses that should be filtered out
 * These are tokens that impersonate legitimate projects
 * Moved from aptos-constants.ts
 */

export const SCAM_TOKENS = new Set([
  // Scam USDC tokens
  "0x397071c01929cc6672a17f130bd62b1bce224309029837ce4f18214cc83ce2a7::USDC::USDC", // "💸 USDC-APTOS.ORG"

  // Scam APT tokens - ONLY 0x1::aptos_coin::AptosCoin is legitimate APT
  "0x48327a479bf5c5d2e36d5e9846362cff2d99e0e27ff92859fc247893fded3fbd::APTOS::APTOS", // "💸 aptclaim.net"
  "0x50788befc1107c0cc4473848a92e5c783c635866ce3c98de71d2eeb7d2a34f85::aptos_coin::AptosCoin", // Fake APT

  // Other known scam tokens
  "0xbbc4a9af0e7fa8885bda5db08028e7b882f2c2bba1e0fedbad1d8316f73f8b2f::ograffio::Ograffio", // "ograffio.com"
  "0xb00be0909b1c38e9b26f1309193f82e6d7b570e8e8bfeaa28bdd287dd174b01a::please::WakeUp", // "You're in a coma"
]);
