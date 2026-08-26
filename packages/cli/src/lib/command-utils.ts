import path from 'path';
import { getProjectConfig } from './lib/config';

const commandsDir = 'packages/cli/src/commands';

function ensureCommandsDir() {
  if (!path.existsSync(commandsDir)) {
    require('fs').mkdirSync(commandsDir, { recursive: true });
  }
}

function writeCommandFile(filename: string, content: string): string {
  ensureCommandsDir();
  const filePath = path.join(commandsDir, filename);
  require('fs').writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function addImportToIndex() {
  let indexContent = require('fs').readFileSync('packages/cli/src/index.ts', 'utf8');

  const sourceFileImport = `import { program } from 'commander';`;
  const targetImportPos = indexContent.indexOf(sourceFileImport) + sourceFileImport.length;
  const injectAfter = 
`\n// Core Contextly commands\nimport('./commands').then(module => module.registerCommands());\n`;

  indexContent = indexContent.slice(0, targetImportPos) + injectAfter + indexContent.slice(targetImportPos);

  require('fs').writeFileSync('packages/cli/src/index.ts', indexContent, 'utf8');
}

export { writeCommandFile, addImportToIndex };