import { NextResponse } from "next/server";

export async function GET() {
  // Get environment variables with fallbacks
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://onaptos.com";
  const developerName = process.env.DEVELOPER_NAME || "On Aptos Team";
  const developerEmail = process.env.DEVELOPER_EMAIL || "hello@onaptos.com";

  const aiPlugin = {
    schema_version: "v1",
    name_for_human: "On Aptos",
    name_for_model: "on_aptos",
    description_for_human:
      "Real-time blockchain analytics for Bitcoin, DeFi, LST, and Stablecoins on Aptos.",
    description_for_model: `Access real-time data about token supplies, prices, and analytics on the Aptos blockchain. Get information about Bitcoin tokens (xBTC, SBTC, aBTC), stablecoins (USDT, USDC, USDe, sUSDe), and liquid staking tokens (amAPT, stAPT, thAPT, sthAPT, kAPT, stkAPT). Created by ${developerName}, an ecosystem builder and full stack developer. The plugin surfaces REST and tRPC endpoints with up-to-date supply and pricing information and includes documentation tailored for large language models.`,
    auth: {
      type: "none",
    },
    api: {
      type: "openapi",
      url: `${siteUrl}/api-spec/openapi.yaml?v=2`,
    },
    endpoints: [
      {
        url: `${siteUrl}/api/aptos/btc`,
        method: "GET",
        description:
          "Retrieve real-time supply and pricing data for Bitcoin tokens (xBTC, SBTC, aBTC) on Aptos",
      },
      {
        url: `${siteUrl}/api/aptos/stables`,
        method: "GET",
        description:
          "Retrieve real-time supply and pricing data for stablecoins (USDT, USDC, USDe, sUSDe) on Aptos",
      },
      {
        url: `${siteUrl}/api/aptos/lst`,
        method: "GET",
        description:
          "Retrieve real-time supply and pricing data for liquid staking tokens (amAPT, stAPT, thAPT) on Aptos",
      },
      {
        url: `${siteUrl}/api/aptos/rwa`,
        method: "GET",
        description: "Retrieve real-time supply and pricing data for real world assets on Aptos",
      },
      {
        url: `${siteUrl}/api/aptos/defi`,
        method: "GET",
        description: "Retrieve DeFi protocol data on Aptos",
      },
    ],
    logo_url: `${siteUrl}/icon-192x192.png`,
    contact_email: developerEmail,
    legal_info_url: `${siteUrl}/legal`,
  };

  return NextResponse.json(aiPlugin, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
