import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestDeduplicator,
  dedupeFetch,
  dedupeAsyncCall,
  withDeduplication,
  createDedupedEndpoint,
} from '@/lib/utils/request-deduplication';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Request Deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestDeduplicator.clear();
  });

  afterEach(() => {
    requestDeduplicator.clear();
  });

  describe('dedupeFetch', () => {
    it('should deduplicate identical fetch requests', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      (global.fetch as any).mockResolvedValue(mockResponse);

      // Make two identical requests concurrently
      const promise1 = dedupeFetch('https://api.example.com/data');
      const promise2 = dedupeFetch('https://api.example.com/data');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Should only call fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Both results should be the same response
      expect(result1).toBe(result2);
    });

    it('should not deduplicate different URLs', async () => {
      const mockResponse1 = new Response('{"data": "test1"}');
      const mockResponse2 = new Response('{"data": "test2"}');

      (global.fetch as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Make requests to different URLs
      const promise1 = dedupeFetch('https://api.example.com/data1');
      const promise2 = dedupeFetch('https://api.example.com/data2');

      await Promise.all([promise1, promise2]);

      // Should call fetch twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not deduplicate different HTTP methods', async () => {
      const mockResponse = new Response('{"data": "test"}');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Make GET and POST requests to same URL
      const promise1 = dedupeFetch('https://api.example.com/data', {
        method: 'GET',
      });
      const promise2 = dedupeFetch('https://api.example.com/data', {
        method: 'POST',
      });

      await Promise.all([promise1, promise2]);

      // Should call fetch twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('dedupeAsyncCall', () => {
    it('should deduplicate async function calls', async () => {
      const mockFn = vi.fn().mockResolvedValue('test-result');

      // Make two identical calls concurrently
      const promise1 = dedupeAsyncCall('test-key', mockFn);
      const promise2 = dedupeAsyncCall('test-key', mockFn);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Should only call the function once
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Both results should be the same
      expect(result1).toBe('test-result');
      expect(result2).toBe('test-result');
    });

    it('should not deduplicate different keys', async () => {
      const mockFn1 = vi.fn().mockResolvedValue('result1');
      const mockFn2 = vi.fn().mockResolvedValue('result2');

      // Make calls with different keys
      const promise1 = dedupeAsyncCall('key1', mockFn1);
      const promise2 = dedupeAsyncCall('key2', mockFn2);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Should call both functions
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });

    it('should handle timeout', async () => {
      const slowFn = () =>
        new Promise(resolve => setTimeout(() => resolve('slow'), 100));

      await expect(dedupeAsyncCall('timeout-test', slowFn, 50)).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('withDeduplication', () => {
    it('should create a deduplicated version of a function', async () => {
      const originalFn = vi
        .fn()
        .mockImplementation((id: number) => Promise.resolve(`result-${id}`));

      const keyGenerator = (id: number) => `user-${id}`;
      const dedupedFn = withDeduplication(originalFn, keyGenerator);

      // Make multiple calls with same parameter
      const promises = [dedupedFn(123), dedupedFn(123), dedupedFn(123)];

      const results = await Promise.all(promises);

      // Should only call original function once
      expect(originalFn).toHaveBeenCalledTimes(1);
      expect(originalFn).toHaveBeenCalledWith(123);

      // All results should be the same
      results.forEach(result => {
        expect(result).toBe('result-123');
      });
    });
  });

  describe('createDedupedEndpoint', () => {
    it('should create a deduplicated API endpoint', async () => {
      const apiCall = vi
        .fn()
        .mockImplementation((userId: string) =>
          Promise.resolve({ id: userId, name: `User ${userId}` })
        );

      const keyGenerator = (userId: string) => `user-profile-${userId}`;
      const dedupedEndpoint = createDedupedEndpoint(apiCall, keyGenerator);

      // Make multiple concurrent calls
      const promises = [
        dedupedEndpoint('user123'),
        dedupedEndpoint('user123'),
        dedupedEndpoint('user456'),
      ];

      const results = await Promise.all(promises);

      // Should call API twice (once for each unique user)
      expect(apiCall).toHaveBeenCalledTimes(2);
      expect(apiCall).toHaveBeenCalledWith('user123');
      expect(apiCall).toHaveBeenCalledWith('user456');

      // Results should match expectations
      expect(results[0]).toEqual({ id: 'user123', name: 'User user123' });
      expect(results[1]).toEqual({ id: 'user123', name: 'User user123' });
      expect(results[2]).toEqual({ id: 'user456', name: 'User user456' });
    });
  });

  describe('requestDeduplicator stats', () => {
    it('should track stats correctly', async () => {
      const mockFn = vi.fn().mockResolvedValue('test');

      // Clear stats
      requestDeduplicator.clear();
      let stats = requestDeduplicator.getStats();
      expect(stats.pendingRequests).toBe(0);
      expect(stats.totalRequests).toBe(0);

      // Make some requests
      const promise1 = dedupeAsyncCall('test1', mockFn);
      const promise2 = dedupeAsyncCall('test2', mockFn);

      // Check pending requests
      stats = requestDeduplicator.getStats();
      expect(stats.pendingRequests).toBe(2);
      expect(stats.totalRequests).toBe(2);

      await Promise.all([promise1, promise2]);

      // Check after completion
      stats = requestDeduplicator.getStats();
      expect(stats.pendingRequests).toBe(0);
      expect(stats.totalRequests).toBe(2);
    });
  });
});
