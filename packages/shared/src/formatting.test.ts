import { describe, it, expect } from 'vitest';
import { formatTimestamp, truncate } from './formatting';

describe('formatting', () => {
  describe('formatTimestamp', () => {
    it('should format ISO string to readable date', () => {
      const result = formatTimestamp('2025-07-15T10:30:00.000Z');
      expect(result).toContain('Jul');
      expect(result).toContain('15');
    });

    it('should format Date object', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = formatTimestamp(date);
      expect(result).toContain('Jan');
      expect(result).toContain('1');
    });
  });

  describe('truncate', () => {
    it('should return string unchanged if shorter than limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate string if longer than limit', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('should return empty string unchanged', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('should truncate at exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });
});
