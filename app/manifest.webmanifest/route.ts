import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "On Aptos",
    short_name: "On Aptos",
    description: "Aptos ecosystem analytics and portfolio tracking",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}
