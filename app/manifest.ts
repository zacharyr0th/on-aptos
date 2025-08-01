import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "On Aptos",
    short_name: "OnAptos",
    description: "A comprehensive guide to the Aptos ecosystem",
    start_url: "/",
    display: "standalone",
    display_override: ["window-controls-overlay"],
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "DeFi",
        url: "/defi",
        icons: [
          { src: "/icons/defi.png", sizes: "192x192", type: "image/png" },
        ],
      },
      {
        name: "Bitcoin",
        url: "/bitcoin",
        icons: [
          { src: "/icons/bitcoin.png", sizes: "192x192", type: "image/png" },
        ],
      },
      {
        name: "Stablecoins",
        url: "/stables",
        icons: [
          {
            src: "/icons/stablecoins.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "RWAs",
        url: "/rwas",
        icons: [
          { src: "/icons/rwas.png", sizes: "192x192", type: "image/png" },
        ],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/screenshot-1.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshots/screenshot-2.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshots/screenshot-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    categories: ["finance", "utilities"],
    lang: "en-US",
    dir: "ltr",
    scope: "/",
    id: "/",
    related_applications: [
      {
        platform: "webapp",
        url: "https://onaptos.com",
      },
    ],
  };
}
