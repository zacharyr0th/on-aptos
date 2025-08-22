import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();

    performanceLogger.info("Performance metrics received", {
      ...metrics,
      userAgent: request.headers.get("user-agent"),
      url: request.headers.get("referer"),
      timestamp: Date.now(),
    });

    return NextResponse.json(
      { received: true, timestamp: Date.now() },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (err) {
    performanceLogger.error(`Failed to log performance metrics: ${err}`);
    return NextResponse.json(
      { error: "Failed to process performance metrics" },
      { status: 500 },
    );
  }
}
