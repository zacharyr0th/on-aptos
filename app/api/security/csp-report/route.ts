import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    securityLogger.warn("CSP violation reported", {
      ...report,
      userAgent: request.headers.get("user-agent"),
      url: request.headers.get("referer"),
      timestamp: Date.now(),
    });

    return NextResponse.json(
      { received: true },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (err) {
    securityLogger.error(`Failed to log CSP report: ${err}`);
    return NextResponse.json(
      { error: "Failed to process CSP report" },
      { status: 500 },
    );
  }
}
