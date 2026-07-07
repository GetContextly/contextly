import fs from 'fs';
import path from 'path';

export interface ProjectInfo {
  name: string;
  hasPackageJson: boolean;
  hasGit: boolean;
  structure: string[];
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
