import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock fetch globally
global.fetch = vi.fn();

describe("GET /api/portfolio/ans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when address is missing", async () => {
    const request = new Request("http://localhost:3000/api/portfolio/ans");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("address");
  });

  it("should return primary name from ANS API when available", async () => {
    const mockAnsResponse = {
      name: "test.apt",
      address: "0x123",
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnsResponse),
    });

    const request = new Request("http://localhost:3000/api/portfolio/ans?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("test.apt");
    expect(body.data.source).toBe("ans-api");
  });

  it("should fallback to GraphQL when ANS API fails", async () => {
    const mockGraphqlResponse = {
      data: {
        current_aptos_names: [
          {
            domain: "test",
            subdomain: null,
            is_primary: true,
            expiration_timestamp: "2024-12-31T23:59:59Z",
            registered_address: "0x123",
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

    const request = new Request("http://localhost:3000/api/portfolio/ans?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("test.apt");
    expect(body.data.source).toBe("graphql");
  });

  it("should return null when no primary name is found", async () => {
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

    const request = new Request("http://localhost:3000/api/portfolio/ans?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBe(null);
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

    const request = new Request("http://localhost:3000/api/portfolio/ans?address=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Failed to fetch primary name");
  });
});
