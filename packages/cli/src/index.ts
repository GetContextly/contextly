#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { scanDirectory } from './scanner';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('contextly')
  .description('CLI to manage your project context')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Contextly in the current directory')
  .action(() => {
    console.log(chalk.green('🔍 Scanning repository...'));
    const info = scanDirectory(process.cwd());

    console.log(chalk.cyan(`Project Name: ${info.name}`));

    const configDir = path.join(process.cwd(), '.contextly');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
      console.log(chalk.green('✅ Created .contextly directory'));
    }

    const config = {
      projectId: null,
      name: info.name,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(configDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    console.log(chalk.green('✨ Contextly initialized! Run "contextly auth" to link to Supabase.'));
  });

program
  .command('auth')
  .description('Authenticate with Contextly')
  .action(() => {
    console.log(chalk.blue('Authenticating...'));
  });

program.parse();
