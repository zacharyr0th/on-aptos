import { readFile } from "fs/promises";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiLogger } from "../core/logger";
import {
  createSEOErrorResponse,
  createSEOHeadResponse,
  ERROR_HEADERS,
  generateAPISitemap,
  generateSEOStructuredData,
  getReadmeSummary,
  getSEOConfig,
  HEAD_HEADERS,
  processLlmsContent,
  SEO_HEADERS,
  validateSEORequest,
} from "./index";

// Mock dependencies
vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

vi.mock("../core/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/config/app", () => ({
  DEVELOPER_CONFIG: {
    name: "Test Developer",
    email: "test@example.com",
    website: "https://test-website.com",
    twitter: "https://twitter.com/test",
    github: "https://github.com/test/repo",
  },
}));

describe("SEO Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://test-site.com");
    vi.stubEnv("DEVELOPER_NAME", "Test Dev");
    vi.stubEnv("DEVELOPER_EMAIL", "dev@test.com");

    // Reset readFile mock to default behavior
    vi.mocked(readFile).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Constants", () => {
    it("should have correct SEO headers for different content types", () => {
      expect(SEO_HEADERS.TEXT_PLAIN).toEqual({
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "index, follow",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Language": "en",
      });

      expect(SEO_HEADERS.JSON_LD).toEqual({
        "Content-Type": "application/ld+json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "index, follow",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      });

      expect(SEO_HEADERS.XML).toEqual({
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-Robots-Tag": "index, follow",
      });
    });

    it("should have correct HEAD headers", () => {
      expect(HEAD_HEADERS.TEXT_PLAIN).toEqual({
        "Content-Type": "text/plain; charset=utf-8",
        "X-Document-Available": "true",
      });
    });

    it("should have correct error headers", () => {
      expect(ERROR_HEADERS).toEqual({
        "Cache-Control": "no-cache",
        "Retry-After": "60",
      });
    });
  });

  describe("validateSEORequest", () => {
    it("should validate requests with normal user-agent", () => {
      const request = new NextRequest("https://test.com", {
        headers: { "user-agent": "Mozilla/5.0 Chrome/91.0" },
      });

      expect(validateSEORequest(request)).toBe(true);
    });

    it("should reject requests with overly long user-agent", () => {
      const longUserAgent = "a".repeat(301);
      const request = new NextRequest("https://test.com", {
        headers: { "user-agent": longUserAgent },
      });

      expect(validateSEORequest(request)).toBe(false);
    });

    it("should handle requests without user-agent", () => {
      const request = new NextRequest("https://test.com");

      expect(validateSEORequest(request)).toBe(true);
    });
  });

  describe("createSEOErrorResponse", () => {
    it("should create proper error response", () => {
      const response = createSEOErrorResponse("Test error content", "TEXT_PLAIN", 500);

      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
      expect(response.headers.get("Retry-After")).toBe("60");
    });

    it("should default to 503 status", () => {
      const response = createSEOErrorResponse("Test error", "JSON_LD");

      expect(response.status).toBe(503);
    });
  });

  describe("createSEOHeadResponse", () => {
    it("should create HEAD response for different content types", () => {
      const response = createSEOHeadResponse("XML");

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/xml");
      expect(response.headers.get("X-Document-Available")).toBe("true");
    });
  });

  describe("getSEOConfig", () => {
    it("should return environment config when available", () => {
      const config = getSEOConfig();

      expect(config.siteUrl).toBe("https://test-site.com");
      expect(config.developerName).toBe("Test Dev");
      expect(config.developerEmail).toBe("dev@test.com");
    });

    it("should fall back to DEVELOPER_CONFIG when env vars missing", () => {
      vi.unstubAllEnvs();

      const config = getSEOConfig();

      expect(config.developerName).toBe("Test Developer");
      expect(config.developerEmail).toBe("test@example.com");
      expect(config.siteUrl).toBe("https://onaptos.com");
    });
  });

  describe("processLlmsContent", () => {
    it("should process llms.txt file successfully", async () => {
      const mockContent = `# Test Content
Built by — Old Name (old@example.com)
GitHub: https://github.com/zacharytylerroth/on-aptos
Website: https://www.zacharyr0th.com/
Twitter: https://x.com/zacharyr0th`;

      vi.mocked(readFile).mockResolvedValue(mockContent);

      const result = await processLlmsContent();

      expect(result).toContain("Built by — Test Dev ");
      expect(result).toContain("dev@test.com");
      expect(result).toContain("https://github.com/test/repo");
      expect(result).toContain("https://test-website.com");
      expect(result).toContain("https://twitter.com/test");
      expect(result).toContain("Generated:");
      expect(result).toContain("Source: https://test-site.com/llms.txt");

      expect(apiLogger.info).toHaveBeenCalledWith(
        "SEO llms.txt processed",
        expect.objectContaining({
          duration: expect.stringMatching(/\d+\.\d+ms/),
          contentLength: expect.any(Number),
          replacements: 5,
        })
      );
    });

    it("should handle file read errors", async () => {
      // Reset the mock to throw an error for this test only
      vi.mocked(readFile).mockRejectedValueOnce(new Error("File not found"));

      await expect(processLlmsContent()).rejects.toThrow("File not found");

      expect(apiLogger.error).toHaveBeenCalledWith(
        "Failed to process llms.txt",
        expect.objectContaining({
          error: "File not found",
          duration: expect.stringMatching(/\d+\.\d+ms/),
        })
      );
    });
  });

  describe("getReadmeSummary", () => {
    it("should extract first 300 words from README", async () => {
      const mockReadme = "word ".repeat(500); // 500 words
      vi.mocked(readFile).mockResolvedValue(mockReadme);

      const result = await getReadmeSummary();

      expect(result.split(" ")).toHaveLength(300);
      expect(apiLogger.info).toHaveBeenCalledWith(
        "SEO README summary generated",
        expect.objectContaining({
          duration: expect.stringMatching(/\d+\.\d+ms/),
          originalLength: expect.any(Number),
          summaryLength: expect.any(Number),
          wordsExtracted: 300,
        })
      );
    });

    it("should return fallback on error", async () => {
      // Mock to reject for this specific test
      vi.mocked(readFile).mockRejectedValueOnce(new Error("File not found"));

      const result = await getReadmeSummary();

      expect(result).toBe("On Aptos – real-time blockchain analytics for the Aptos ecosystem.");
      expect(apiLogger.warn).toHaveBeenCalledWith(
        "Failed to read README, using fallback",
        expect.objectContaining({
          error: "File not found",
          duration: expect.stringMatching(/\d+\.\d+ms/),
        })
      );
    });
  });

  describe("generateSEOStructuredData", () => {
    it("should generate valid schema.org structured data", () => {
      const data = generateSEOStructuredData();

      expect(data["@context"]).toBe("https://schema.org");
      expect(data["@type"]).toBe("WebAPI");
      expect(data["@id"]).toBe("https://test-site.com/api");
      expect(data.name).toBe("On Aptos API");
      expect(data.url).toBe("https://test-site.com");
      expect(data.documentation).toBe("https://test-site.com/llms.txt");

      expect(data.provider).toEqual({
        "@type": "Person",
        name: "Test Dev",
        url: "https://test-website.com",
        sameAs: ["https://twitter.com/test", "https://github.com/test/repo"],
        jobTitle: "Ecosystem Builder & Full Stack Developer",
        description: expect.any(String),
      });

      expect(data.mainEntity.dataset).toHaveLength(3);
      expect(data.category).toContain("Blockchain");
      expect(data.keywords).toContain("Aptos blockchain");

      expect(apiLogger.info).toHaveBeenCalledWith(
        "SEO structured data generated",
        expect.objectContaining({
          duration: expect.stringMatching(/\d+\.\d+ms/),
          datasets: 3,
          categories: expect.any(Number),
          keywords: expect.any(Number),
        })
      );
    });
  });

  describe("generateAPISitemap", () => {
    it("should generate valid XML sitemap", () => {
      const sitemap = generateAPISitemap();

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain("https://test-site.com/api/data/aptos/btc");
      expect(sitemap).toContain("https://test-site.com/api/data/aptos/stables");
      expect(sitemap).toContain("https://test-site.com/api/data/aptos/rwas");
      expect(sitemap).toContain("https://test-site.com/api/data/prices/panora");
      expect(sitemap).toContain("<changefreq>hourly</changefreq>");
      expect(sitemap).toContain("<priority>0.8</priority>");

      expect(apiLogger.info).toHaveBeenCalledWith(
        "SEO API sitemap generated",
        expect.objectContaining({
          duration: expect.stringMatching(/\d+\.\d+ms/),
          endpoints: 4,
          sitemapLength: expect.any(Number),
        })
      );
    });

    it("should include current timestamp in lastmod", () => {
      const sitemap = generateAPISitemap();
      const currentYear = new Date().getFullYear();

      expect(sitemap).toContain(`<lastmod>${currentYear}`);
    });
  });

  describe("Performance monitoring", () => {
    it("should log performance metrics for all functions", async () => {
      vi.mocked(readFile).mockResolvedValue("test content");

      await processLlmsContent();
      await getReadmeSummary();
      generateSEOStructuredData();
      generateAPISitemap();

      expect(apiLogger.info).toHaveBeenCalledTimes(4);

      // Check that all calls include duration metrics
      const calls = vi.mocked(apiLogger.info).mock.calls;
      calls.forEach(([message, data]) => {
        expect(data).toHaveProperty("duration");
        expect(data.duration).toMatch(/\d+\.\d+ms/);
      });
    });
  });
});
