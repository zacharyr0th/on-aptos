import { type NextRequest, NextResponse } from "next/server";

/**
 * Handle deep link responses from Petra wallet for disconnection
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Redirect to home page with parameters
  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("petra_action", "disconnect");

  return NextResponse.redirect(redirectUrl);
}
