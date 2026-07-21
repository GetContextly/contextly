import { describe, it, expect } from 'vitest';
import { parseSince, getRelativeTime } from './date_utils';

describe('date_utils', () => {
  describe('parseSince', () => {
    it('should pass through ISO 8601 strings unchanged', () => {
      const iso = '2026-07-10T12:00:00.000Z';
      expect(parseSince(iso)).toBe(iso);
    });

    it('should parse "1h" shorthand to ~1 hour ago', () => {
      const before = new Date();
      const result = new Date(parseSince('1h'));
      const after = new Date();
      const diffMs = before.getTime() - result.getTime();
      // Should be between 59 and 61 minutes
      expect(diffMs).toBeGreaterThanOrEqual(59 * 60 * 1000);
      expect(diffMs).toBeLessThanOrEqual(61 * 60 * 1000);
    });

    it('should parse "7d" shorthand to ~7 days ago', () => {
      const before = new Date();
      const result = new Date(parseSince('7d'));
      const after = new Date();
      const diffMs = before.getTime() - result.getTime();
      // Should be between 6d23h and 7d1h
      expect(diffMs).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
      expect(diffMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
    });

    it('should parse "30m" shorthand to ~30 minutes ago', () => {
      const before = new Date();
      const result = new Date(parseSince('30m'));
      const diffMs = before.getTime() - result.getTime();
      expect(diffMs).toBeGreaterThanOrEqual(29 * 60 * 1000);
      expect(diffMs).toBeLessThanOrEqual(31 * 60 * 1000);
    });

    it('should throw on invalid format', () => {
      expect(() => parseSince('invalid')).toThrow('Invalid "since" format');
      expect(() => parseSince('5x')).toThrow('Invalid "since" format');
      expect(() => parseSince('')).toThrow('Invalid "since" format');
    });
  });

  describe('getRelativeTime', () => {
    it('should return minutes ago for recent dates', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(getRelativeTime(fiveMinAgo)).toBe('5m ago');
    });

    it('should return hours ago for dates within a day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(getRelativeTime(threeHoursAgo)).toBe('3h ago');
    });

    it('should return days ago for older dates', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(getRelativeTime(tenDaysAgo)).toBe('10d ago');
    });
  });
});
