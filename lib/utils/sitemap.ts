import { MetadataRoute } from "next";

export interface SitemapRoute {
  path: string;
  priority: number;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  lastModified?: Date;
}

// Core app routes based on manifest.ts structure
export const coreRoutes: SitemapRoute[] = [
  {
    path: "/",
    priority: 1.0,
    changeFrequency: "daily",
  },
  {
    path: "/bitcoin",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/defi",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/lst",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/stablecoins",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/btc", // Alternative bitcoin path
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/stables", // Alternative stablecoins path
    priority: 0.9,
    changeFrequency: "weekly",
  },
];

// API routes for data access and LLM consumption
export const apiRoutes: SitemapRoute[] = [
  {
    path: "/api/aptos/btc",
    priority: 0.8,
    changeFrequency: "hourly", // Bitcoin data changes frequently
  },
  {
    path: "/api/aptos/lst",
    priority: 0.8,
    changeFrequency: "hourly", // LST data changes frequently
  },
  {
    path: "/api/aptos/stables",
    priority: 0.8,
    changeFrequency: "hourly", // Stablecoin data changes frequently
  },
  {
    path: "/api/prices",
    priority: 0.7,
    changeFrequency: "hourly", // Price data changes very frequently
  },
];

// Special documentation routes for LLMs and developers
export const documentationRoutes: SitemapRoute[] = [
  {
    path: "/llms.txt",
    priority: 0.95, // High priority for LLM documentation
    changeFrequency: "weekly",
  },
];

// Helper function to generate sitemap entries with current timestamps
export function generateSitemapEntries(
  routes: SitemapRoute[],
  baseUrl: string,
): MetadataRoute.Sitemap {
  const currentDate = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: route.lastModified || currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

// Helper function to get all routes organized by type
export function getAllRoutes(): {
  core: SitemapRoute[];
  api: SitemapRoute[];
  documentation: SitemapRoute[];
} {
  return {
    core: coreRoutes,
    api: apiRoutes,
    documentation: documentationRoutes,
  };
}

// Helper function to validate sitemap entries
export function validateSitemapEntry(entry: MetadataRoute.Sitemap[0]): boolean {
  return (
    typeof entry.url === "string" &&
    entry.url.length > 0 &&
    typeof entry.priority === "number" &&
    entry.priority >= 0 &&
    entry.priority <= 1 &&
    entry.lastModified instanceof Date &&
    [
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
    ].includes(entry.changeFrequency as string)
  );
}

// Helper function to prioritize routes for sitemap ordering
export function sortBySEOPriority(
  routes: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  return routes.sort((a, b) => {
    // Primary sort by priority
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

    const aFreq =
      frequencyOrder[a.changeFrequency as keyof typeof frequencyOrder] || 0;
    const bFreq =
      frequencyOrder[b.changeFrequency as keyof typeof frequencyOrder] || 0;

    return bFreq - aFreq;
  });
}
