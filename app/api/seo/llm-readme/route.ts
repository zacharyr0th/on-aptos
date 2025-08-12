import { readFile } from "fs/promises";
import { join } from "path";

import { NextResponse } from "next/server";

// Simple plain-text route exposing a concise README for LLMs and search engines.
// The content is generated from the repository root README.md and trimmed to the first 300 words.
async function getSummary(): Promise<string> {
  try {
    const fullPath = join(process.cwd(), "README.md");
    const md = await readFile(fullPath, "utf-8");
    const words = md.split(/\s+/).slice(0, 300).join(" ");
    return words;
  } catch {
    return "On Aptos – real-time blockchain analytics for the Aptos ecosystem.";
  }
}

export async function GET() {
  const summary = await getSummary();
  const lastModified = new Date().toUTCString();

  return new NextResponse(summary + `\n\nLast-Modified: ${lastModified}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Language": "en",
      "Cache-Control": "public, max-age=86400, immutable",
      "Last-Modified": lastModified,
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Document-Available": "true",
    },
  });
}
