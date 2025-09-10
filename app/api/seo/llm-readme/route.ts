import { NextResponse } from "next/server";

import { createSEOHeadResponse, getReadmeSummary, SEO_HEADERS } from "@/lib/utils/seo";

export async function GET() {
  const summary = await getReadmeSummary();
  const lastModified = new Date().toUTCString();

  return new NextResponse(summary + `\n\nLast-Modified: ${lastModified}\n`, {
    headers: {
      ...SEO_HEADERS.TEXT_PLAIN,
      "Last-Modified": lastModified,
    },
  });
}

export async function HEAD() {
  return createSEOHeadResponse("TEXT_PLAIN");
}
