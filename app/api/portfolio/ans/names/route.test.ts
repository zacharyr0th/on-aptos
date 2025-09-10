import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock fetch globally
global.fetch = vi.fn();

describe("GET /api/portfolio/ans/names", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when address is missing", async () => {
    const request = new Request("http://localhost:3000/api/portfolio/ans/names");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Address parameter is required");
  });

  it("should return 400 for invalid address format", async () => {
    const request = new Request("http://localhost:3000/api/portfolio/ans/names?address=invalid");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid Aptos address format");
  });

  it("should return names from ANS API when available", async () => {
    const mockAnsResponse = {
      name: "test.apt",
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnsResponse),
    });

    const request = new Request("http://localhost:3000/api/portfolio/ans/names?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(["test.apt"]);
    expect(body.source).toBe("ans-api");
  });

  it("should fallback to GraphQL when ANS API fails", async () => {
    const mockGraphqlResponse = {
      data: {
        current_aptos_names: [
          {
            domain: "test",
            subdomain: null,
            is_primary: true,
          },
          {
            domain: "example",
            subdomain: "sub",
            is_primary: false,
          },
        ],
      },
    };

    // First call (ANS API) fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    // Second call (GraphQL) succeeds
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGraphqlResponse),
    });

    const request = new Request("http://localhost:3000/api/portfolio/ans/names?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(["test.apt", "sub.example.apt"]);
    expect(body.source).toBe("graphql");
  });

  it("should return empty array when no names are found", async () => {
    const mockGraphqlResponse = {
      data: {
        current_aptos_names: [],
      },
    };

    // ANS API fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    // GraphQL returns empty results
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGraphqlResponse),
    });

    const request = new Request("http://localhost:3000/api/portfolio/ans/names?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
    expect(body.source).toBe("graphql");
  });

  it("should handle GraphQL errors gracefully", async () => {
    const mockGraphqlResponse = {
      errors: [{ message: "GraphQL error" }],
    };

    // ANS API fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    // GraphQL returns errors
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGraphqlResponse),
    });

    const request = new Request("http://localhost:3000/api/portfolio/ans/names?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Failed to fetch account names");
  });

  it("should handle network errors gracefully", async () => {
    // Both API calls fail
    (fetch as any)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"));

    const request = new Request("http://localhost:3000/api/portfolio/ans/names?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Failed to fetch account names");
  });
});
