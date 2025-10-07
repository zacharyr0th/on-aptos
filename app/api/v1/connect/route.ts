import { NextRequest, NextResponse } from "next/server";

/**
 * Handle deep link responses from Petra wallet for connection
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const response = searchParams.get("response");
  const data = searchParams.get("data");

  // Redirect to home page with parameters
  // The client-side code will handle the response
  const redirectUrl = new URL("/", request.url);

  if (response) {
    redirectUrl.searchParams.set("petra_response", response);
  }

  if (data) {
    redirectUrl.searchParams.set("petra_data", data);
  }

  redirectUrl.searchParams.set("petra_action", "connect");

  return NextResponse.redirect(redirectUrl);
}
