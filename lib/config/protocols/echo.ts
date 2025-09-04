import { BTC_METADATA } from "../tokens/btc";

export const ECHO_PROTOCOL_CONFIG = {
  protocol: "Echo",
  enabled: true,
  markets: [
    {
      symbol: "aBTC",
      marketAddress:
        "0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7",
      assetType: BTC_METADATA.aBTC.assetAddress,
      description: BTC_METADATA.aBTC.name,
      decimals: BTC_METADATA.aBTC.decimals,
      apyBase: 0.0,
      apyReward: 0.04,
      apyBaseBorrow: 0.0,
      totalBorrow: 0,
      totalBorrowUsd: 0,
    },
  ],
};

export const PROTOCOL_ICONS = {
  echelon: "/icons/protocols/echelon.avif",
  echo: "/icons/btc/echo.webp",
  default: "/icons/btc/bitcoin.webp",
} as const;
