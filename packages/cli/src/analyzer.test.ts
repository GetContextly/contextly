import { describe, it, expect, vi } from 'vitest';
import { analyzeDiff, generateBrief } from './analyzer';
import { execFileSync } from 'child_process';

vi.mock('child_process', () => ({
  execFileSync: vi.fn()
}));

describe('analyzer', () => {
  describe('analyzeDiff', () => {
    it('should return null if commit message does not contain architectural keywords', () => {
      (execFileSync as any).mockReturnValueOnce('diff data')
        .mockReturnValueOnce('stat data')
        .mockReturnValueOnce('feat: just a regular feature');

      const result = analyzeDiff('/test/dir', 'sha123');
      expect(result).toBeNull();
    });

    it('should return decision if commit message contains architectural keywords', () => {
      (execFileSync as any).mockReturnValueOnce('diff data')
        .mockReturnValueOnce('src/app.tsx | 10 +')
        .mockReturnValueOnce('refactor: migrate to supabase for auth');

      const result = analyzeDiff('/test/dir', 'sha123');
      expect(result).not.toBeNull();
      expect(result?.summary).toBe('refactor: migrate to supabase for auth');
      expect(result?.relatedFiles).toContain('src/app.tsx');
    });

    it('should detect architectural changes by file path alone', () => {
      (execFileSync as any).mockReturnValueOnce('diff data')
        .mockReturnValueOnce('supabase/migrations/001_add_users.sql | 20 +')
        .mockReturnValueOnce('feat: add user table');

      const result = analyzeDiff('/test/dir', 'sha123');
      expect(result).not.toBeNull();
      expect(result?.summary).toBe('feat: add user table');
      expect(result?.confidence).toBe(0.5); // path-only match
    });

    it('should give high confidence when both message and path match', () => {
      (execFileSync as any).mockReturnValueOnce('diff data')
        .mockReturnValueOnce('src/auth/middleware.ts | 15 +')
        .mockReturnValueOnce('security: add rate limiting to auth middleware');

      const result = analyzeDiff('/test/dir', 'sha123');
      expect(result).not.toBeNull();
      expect(result?.confidence).toBe(0.9); // both match
    });

    it('should detect broader keywords like middleware, cache, oauth', () => {
      (execFileSync as any).mockReturnValueOnce('diff data')
        .mockReturnValueOnce('src/cache.ts | 5 +')
        .mockReturnValueOnce('cache: add redis caching layer');

      const result = analyzeDiff('/test/dir', 'sha123');
      expect(result).not.toBeNull();
    });

    it('should handle git errors gracefully', () => {
      (execFileSync as any).mockImplementation(() => {
        throw new Error('git error');
      });

      const result = analyzeDiff('/test/dir', 'sha123');
      expect(result).toBeNull();
    });
  });

  describe('generateBrief', () => {
    it('should generate a message when no decisions are provided', () => {
      const brief = generateBrief([]);
      expect(brief).toContain('No major architectural decisions identified yet.');
    });

    it('should list decisions in the brief', () => {
      const decisions = [{
        summary: 'Migration to Supabase',
        reasoning: 'Better scaling\nand auth support.',
        relatedFiles: ['schema.sql'],
        confidence: 0.9
      }];
      const brief = generateBrief(decisions);
      expect(brief).toContain('Migration to Supabase');
      expect(brief).toContain('and auth support.');
      expect(brief).toContain('schema.sql');
    });
  });
});
