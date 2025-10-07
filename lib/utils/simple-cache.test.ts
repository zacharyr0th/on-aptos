import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnifiedCache } from "./cache/unified-cache";

describe("UnifiedCache (SimpleCache compatibility)", () => {
  let cache: UnifiedCache<string>;

  beforeEach(() => {
    cache = new UnifiedCache<string>({ ttl: 100 }); // 100ms TTL
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should expire values after TTL", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");

    // Advance time by 101ms
    vi.advanceTimersByTime(101);
    expect(cache.get("key1")).toBeNull();
  });

  it("should not expire values before TTL", () => {
    cache.set("key1", "value1");

    // Advance time by 99ms
    vi.advanceTimersByTime(99);
    expect(cache.get("key1")).toBe("value1");
  });

  it("should update expiry when setting existing key", () => {
    cache.set("key1", "value1");

    // Advance time by 50ms
    vi.advanceTimersByTime(50);

    // Update the value
    cache.set("key1", "value2");

    // Advance time by another 60ms (total 110ms from first set)
    vi.advanceTimersByTime(60);

    // Should still be available since it was reset
    expect(cache.get("key1")).toBe("value2");
  });

  it("should clear all values", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");

    cache.clear();

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBeNull();
    expect(cache.get("key3")).toBeNull();
  });

  it("should handle different data types", () => {
    const objectCache = new UnifiedCache<{ data: string }>({ ttl: 100 });
    const obj = { data: "test" };
    objectCache.set("key1", obj);
    expect(objectCache.get("key1")).toEqual(obj);

    const arrayCache = new UnifiedCache<number[]>({ ttl: 100 });
    const arr = [1, 2, 3];
    arrayCache.set("key1", arr);
    expect(arrayCache.get("key1")).toEqual(arr);
  });

  it("should handle concurrent operations", () => {
    const promises = [];

    // Set multiple values concurrently
    for (let i = 0; i < 10; i++) {
      promises.push(Promise.resolve(cache.set(`key${i}`, `value${i}`)));
    }

    Promise.all(promises).then(() => {
      // Verify all values are stored
      for (let i = 0; i < 10; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });
  });
});
