import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface ProjectInfo {
  name: string;
  hasPackageJson: boolean;
  hasGit: boolean;
  structure: string[];
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export const scanDirectory = (dir: string): ProjectInfo => {
  const name = path.basename(dir);
  const hasPackageJson = fs.existsSync(path.join(dir, 'package.json'));
  const hasGit = fs.existsSync(path.join(dir, '.git'));

  // Basic structure scan
  const items = fs.readdirSync(dir).filter(i => !i.startsWith('.') && !i.includes('node_modules'));

  return {
    name,
    hasPackageJson,
    hasGit,
    structure: items
  };
};

export const getRecentCommits = (dir: string, limit = 10): CommitInfo[] => {
  try {
    const output = execSync(
      `git -C "${dir}" log -n ${limit} --pretty=format:"%H|%s|%ai|%an"`,
      { encoding: 'utf-8' }
    );

    return output.split('\n').filter(Boolean).map(line => {
      const [sha, message, date, author] = line.split('|');
      return { sha, message, date, author };
    });
  } catch (error) {
    console.error('Failed to get git logs:', error);
    return [];
  }
};

export const getRemoteUrl = (dir: string): string | null => {
  try {
    const output = execSync(
      `git -C "${dir}" remote get-url origin`,
      { encoding: 'utf-8' }
    );
    return output.trim();
  } catch (error) {
    return null;
  }
};
