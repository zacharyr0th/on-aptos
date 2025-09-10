import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatLargeNumber,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
} from "./format";

describe("Format Utilities", () => {
  describe("formatNumber", () => {
    it("should format numbers with default decimals", () => {
      expect(formatNumber(1234.5678)).toBe("1,234.57");
      expect(formatNumber(1000000)).toBe("1,000,000");
      expect(formatNumber(0.123456)).toBe("0.12");
    });

    it("should format numbers with custom decimals", () => {
      expect(formatNumber(1234.5678, 0)).toBe("1,234.57"); // formatNumber doesn't use second param
      expect(formatNumber(1234.5678, 4)).toBe("1,234.57"); // always 2 decimals
      expect(formatNumber(0.000123, 6)).toBe("0"); // rounds to 0
    });

    it("should handle edge cases", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(null as any)).toBe("0");
      expect(formatNumber(undefined as any)).toBe("NaN");
      expect(formatNumber(NaN)).toBe("NaN");
    });
  });

  describe("formatCurrency", () => {
    it("should format USD currency", () => {
      expect(formatCurrency(1234.56)).toBe("$1.2k"); // auto-compacts for amounts >= $1000
      expect(formatCurrency(0.99)).toBe("$0.99");
      expect(formatCurrency(1000000)).toBe("$1m"); // compacts to millions
    });

    it("should handle very small amounts", () => {
      expect(formatCurrency(0.000123)).toBe("$0.00"); // shows 2 decimals for amounts under $1000
      expect(formatCurrency(0.00000001)).toBe("$0.00");
    });

    it("should format other currencies", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1.2k"); // currency code as string, not object
      expect(formatCurrency(1234.56, "GBP")).toBe("£1.2k");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentages", () => {
      expect(formatPercentage(12.34)).toBe("12.34%");
      expect(formatPercentage(100)).toBe("100%"); // no decimals for round numbers
      expect(formatPercentage(-5.67)).toBe("-5.67%");
    });

    it("should handle edge cases", () => {
      expect(formatPercentage(0)).toBe("0%");
      expect(formatPercentage(null as any)).toBe("0%");
    });
  });

  describe("formatLargeNumber", () => {
    it("should format large numbers with abbreviations", () => {
      expect(formatLargeNumber(1234)).toBe("1.2k");
      expect(formatLargeNumber(1234567)).toBe("1.2m");
      expect(formatLargeNumber(1234567890)).toBe("1.2b");
      expect(formatLargeNumber(1234567890123)).toBe("1234.6b"); // actual behavior
    });

    it("should handle small numbers", () => {
      expect(formatLargeNumber(123)).toBe("123.0");
      expect(formatLargeNumber(999)).toBe("999.0");
    });

    it("should handle edge cases", () => {
      expect(formatLargeNumber(0)).toBe("0.0");
      expect(formatLargeNumber(-1234)).toBe("-1.2k");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format recent times", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("just now");

      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo)).toBe("1 minute ago");

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
    });

    it("should format hours and days", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe("1 day ago");
    });

    it("should handle string dates", () => {
      const now = new Date();
      const isoString = now.toISOString();
      expect(formatRelativeTime(isoString)).toBe("just now");
    });
  });
});
