import type { MetadataRoute } from "next";
import { APP_ROUTES, SITEMAP_ROUTES } from "@/lib/config/routes";

// Force Node.js runtime instead of edge runtime
export const runtime = "nodejs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const isoDate = new Date().toISOString();

  // Generate static pages from config
  const staticPages = SITEMAP_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: isoDate,
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));

  // API endpoints for data access
  const apiPages = [
    {
      url: `${baseUrl}${APP_ROUTES.API.BTC}`,
      lastModified: isoDate,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.STABLES}`,
      lastModified: isoDate,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.RWAS}`,
      lastModified: isoDate,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.TOKENS}`,
      lastModified: isoDate,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.PRICES}`,
      lastModified: isoDate,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.SEO.LLM_METADATA}`,
      lastModified: isoDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.SEO.LLM_README}`,
      lastModified: isoDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}${APP_ROUTES.API.SEO.LLMS_TXT}`,
      lastModified: isoDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
  ];

  // Special documentation for LLMs and crawlers - HIGHEST PRIORITY
  const documentationPages = [
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: isoDate,
      changeFrequency: "weekly" as const,
      priority: 0.98, // Second highest priority
    },
    {
      url: `${baseUrl}/.well-known/ai-plugin.json`,
      lastModified: isoDate,
      changeFrequency: "monthly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/humans.txt`,
      lastModified: isoDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/api-spec`,
      lastModified: isoDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
  ];

  // Combine all pages with proper prioritization
  const allPages = [
    ...staticPages.filter((p) => p.url === `${baseUrl}/`), // Homepage first
    ...documentationPages.filter((p) => p.url === `${baseUrl}/llms.txt`), // LLM docs second
    ...staticPages.filter((p) => p.url !== `${baseUrl}/`), // Other static pages
    ...documentationPages.filter((p) => p.url !== `${baseUrl}/llms.txt`), // Other docs
    ...apiPages, // API endpoints
  ];

  // Sort by priority (highest first) then by change frequency
  return allPages.sort((a, b) => {
    if (b.priority !== a.priority) {
      return (b.priority || 0) - (a.priority || 0);
    }
    // Secondary sort by change frequency importance
    const frequencyOrder = {
      always: 6,
      hourly: 5,
      daily: 4,
      weekly: 3,
      monthly: 2,
      yearly: 1,
      never: 0,
    };
    return frequencyOrder[b.changeFrequency] - frequencyOrder[a.changeFrequency];
  });
}

// Revalidate every 15 minutes to keep API data fresh but not overwhelm servers
export const revalidate = 900;
