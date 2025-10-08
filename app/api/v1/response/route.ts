import { type NextRequest, NextResponse } from "next/server";

/**
 * Handle deep link responses from Petra wallet for transactions/messages
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const response = searchParams.get("response");
  const data = searchParams.get("data");

  // Redirect to home page with parameters
  const redirectUrl = new URL("/", request.url);

  if (response) {
    redirectUrl.searchParams.set("petra_response", response);
  }

  if (data) {
    redirectUrl.searchParams.set("petra_data", data);
  }

  redirectUrl.searchParams.set("petra_action", "response");

  return NextResponse.redirect(redirectUrl);
}
