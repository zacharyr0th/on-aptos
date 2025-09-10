import { type NextRequest, NextResponse } from "next/server";

// Re-export the tokens route from markets/tokens
export async function GET(request: NextRequest) {
  // Import the handler from the original location
  const { GET: TokensHandler } = await import("../../markets/tokens/route");

  // Forward the request to the original handler
  return TokensHandler(request);
}
