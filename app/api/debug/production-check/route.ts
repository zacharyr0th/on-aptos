import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environmentVariables: {
      // Check which critical env vars are present (without exposing values)
      CMC_API_KEY: !!process.env.CMC_API_KEY,
      APTOS_BUILD_SECRET: !!process.env.APTOS_BUILD_SECRET,
      PANORA_API_KEY: !!process.env.PANORA_API_KEY,
      RWA_API_KEY: !!process.env.RWA_API_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
      NEXT_PUBLIC_CORS_ORIGINS: process.env.NEXT_PUBLIC_CORS_ORIGINS || 'not set',
    },
    apiEndpoints: {
      lst: '/api/aptos/lst',
      stables: '/api/aptos/stables',
      btc: '/api/aptos/btc',
    },
    tests: {
      lstApiTest: null as any,
      stablesApiTest: null as any,
      btcApiTest: null as any,
    },
  };

  // Test LST endpoint
  try {
    const lstResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/aptos/lst`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    checks.tests.lstApiTest = {
      status: lstResponse.status,
      ok: lstResponse.ok,
      statusText: lstResponse.statusText,
    };
  } catch (error) {
    checks.tests.lstApiTest = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test Stables endpoint
  try {
    const stablesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/aptos/stables`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    checks.tests.stablesApiTest = {
      status: stablesResponse.status,
      ok: stablesResponse.ok,
      statusText: stablesResponse.statusText,
    };
  } catch (error) {
    checks.tests.stablesApiTest = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test BTC endpoint
  try {
    const btcResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/aptos/btc`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    checks.tests.btcApiTest = {
      status: btcResponse.status,
      ok: btcResponse.ok,
      statusText: btcResponse.statusText,
    };
  } catch (error) {
    checks.tests.btcApiTest = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return NextResponse.json(checks, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}