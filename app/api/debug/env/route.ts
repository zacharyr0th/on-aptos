import { NextResponse } from 'next/server';

// Debug endpoint - only available in development
export async function GET() {
  // Block this endpoint entirely in production
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasRequiredKeys: {
      CMC_API_KEY: !!process.env.CMC_API_KEY,
      PANORA_API_KEY: !!process.env.PANORA_API_KEY,
      APTOS_BUILD_SECRET: !!process.env.APTOS_BUILD_SECRET,
      RWA_API_KEY: !!process.env.RWA_API_KEY,
    },
    keyLengths: {
      CMC_API_KEY: process.env.CMC_API_KEY?.length || 0,
      PANORA_API_KEY: process.env.PANORA_API_KEY?.length || 0,
      APTOS_BUILD_SECRET: process.env.APTOS_BUILD_SECRET?.length || 0,
      RWA_API_KEY: process.env.RWA_API_KEY?.length || 0,
    },
    timestamp: new Date().toISOString(),
  });
}
