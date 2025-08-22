import { NextResponse } from "next/server";


export const runtime = "edge";

export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: Date.now(),
      uptime: process.uptime ? process.uptime() : undefined,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "unknown",
    };

    apiLogger.debug("Health check performed");

    return NextResponse.json(health, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    apiLogger.error(`Health check failed: ${error}`);
    return NextResponse.json(
      { status: "error", timestamp: Date.now() },
      { status: 503 },
    );
  }
}
