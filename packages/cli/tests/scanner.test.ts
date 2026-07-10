import { describe, it, expect, vi } from 'vitest';
import { scanDirectory } from '../src/scanner';
import fs from 'fs';

vi.mock('fs');

describe('CLI Scanner', () => {
  it('should correctly identify project metadata', () => {
    (fs.existsSync as any).mockImplementation((path: string) => {
      if (path.endsWith('package.json')) return true;
      if (path.endsWith('.git')) return true;
      return false;
    });

    (fs.readdirSync as any).mockReturnValue(['src', 'package.json']);

    const result = scanDirectory('/mock/dir');

    expect(result.name).toBe('dir');
    expect(result.hasPackageJson).toBe(true);
    expect(result.hasGit).toBe(true);
  });
});
