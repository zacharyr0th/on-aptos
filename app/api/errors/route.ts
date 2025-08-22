import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const error = await request.json();

    errorLogger.error("Client error reported", {
      ...error,
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
    errorLogger.error(`Failed to log client error: ${err}`);
    return NextResponse.json(
      { error: "Failed to process error report" },
      { status: 500 },
    );
  }
}
