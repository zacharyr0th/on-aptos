import { MetadataRoute } from "next";

// Force Node.js runtime instead of edge runtime
export const runtime = "nodejs";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/api/aptos/btc",
          "/api/aptos/stables",
          "/api/aptos/rwas",
          "/api/prices",
          "/api/seo/",
          "/api/seo/*",
          "/.well-known/ai-plugin.json",
          "/llms.txt", // Specifically allow LLM documentation
          "/bitcoin",
          "/defi",
          "/stablecoins",
          "/rwas",
          "/btc",
          "/stables",
        ],
        disallow: [
          "/_next/", // Still disallow Next.js internal files
          "/admin/", // Disallow any admin routes (if you add them later)
          "/*.json$", // Disallow JSON files except API
          "/api/_*", // Disallow internal API routes
          "/home", // Common bot paths that don't exist
          "/about",
          "/contact",
          "/about-us",
          "/contact-us",
          "/services",
          "/products",
          "/blog",
          "/news",
          "/privacy",
          "/privacy-policy",
          "/terms",
          "/terms-of-service",
          "/login",
          "/signin",
          "/signup",
          "/register",
          "/wp-admin",
          "/wp-login.php",
          "/.env",
          "/config",
        ],
        crawlDelay: 1, // Be respectful to crawlers
      },
      // OpenAI GPT Bot - HIGHEST PRIORITY
      {
        userAgent: "GPTBot",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0, // No delay for GPT
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      // Anthropic Claude - HIGH PRIORITY
      {
        userAgent: "Claude-Web",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      // Google AI/Bard - HIGH PRIORITY
      {
        userAgent: "Google-Extended",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      {
        userAgent: "Bard",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      // Microsoft/Bing AI
      {
        userAgent: "bingbot",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 1,
      },
      {
        userAgent: "msnbot",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 1,
      },
      // Perplexity AI
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 0,
      },
      // Meta AI
      {
        userAgent: "meta-externalagent",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 1,
      },
      // Other AI/LLM bots
      {
        userAgent: "CCBot", // Common Crawl (used by many LLMs)
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 2,
      },
      {
        userAgent: "YouBot", // You.com
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 1,
      },
      {
        userAgent: "Diffbot",
        allow: ["/", "/api/", "/llms.txt"],
        crawlDelay: 2,
      },
      // Search engines - standard access
      {
        userAgent: "Googlebot",
        allow: "/",
        crawlDelay: 1,
      },
      {
        userAgent: "Slurp", // Yahoo
        allow: "/",
        crawlDelay: 2,
      },
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        crawlDelay: 1,
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        crawlDelay: 2,
      },
      {
        userAgent: "YandexBot",
        allow: "/",
        crawlDelay: 2,
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/api/seo/api-sitemap.xml`],
    host: baseUrl,
  };
}
