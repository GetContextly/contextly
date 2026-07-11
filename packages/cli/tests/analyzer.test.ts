import { describe, it, expect, vi } from 'vitest';
import { analyzeDiff } from '../src/analyzer';
import { execSync } from 'child_process';

vi.mock('child_process', () => ({
  execSync: vi.fn()
}));

describe('Semantic Analyzer', () => {
  it('should identify a database schema change as architectural', () => {
    // Mock git output
    (execSync as any).mockReturnValueOnce('diff content...') // show sha
      .mockReturnValueOnce('supabase/schema.sql | 10 +') // show stat
      .mockReturnValueOnce('feat: update database schema for auth'); // log message

    const result = analyzeDiff('./', 'mock-sha');

    expect(result).not.toBeNull();
    expect(result?.summary).toBe('feat: update database schema for auth');
    expect(result?.relatedFiles).toContain('supabase/schema.sql');
  });

  it('should ignore a simple typo fix', () => {
    (execSync as any).mockReturnValueOnce('diff content...')
      .mockReturnValueOnce('README.md | 2 +-')
      .mockReturnValueOnce('fix: fix typo in readme');

    const result = analyzeDiff('./', 'mock-sha');

    expect(result).toBeNull();
  });
});
