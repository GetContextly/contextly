#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { scanDirectory } from './scanner';
import fs from 'fs';
import path from 'path';
import { ensureDir, writeJson } from './utils';
import { CLI_INFO } from '@contextly/shared';

const program = new Command();

program
  .name(CLI_INFO.NAME)
  .description('CLI to manage your project context')
  .version(CLI_INFO.VERSION);

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
    console.log(chalk.blue('🔒 Authenticating...'));
    console.log(chalk.yellow('Device flow or browser redirect would happen here.'));
    // Mock successful login for now
    const mockSession = {
      accessToken: 'mock_token_' + Math.random().toString(36).substring(7),
      user: { id: 'mock_user_id', email: 'user@example.com' }
    };
    const { saveSession } = require('./auth');
    saveSession(mockSession);
    console.log(chalk.green('✅ Successfully authenticated as user@example.com'));
  });

program
  .command('logout')
  .description('Log out from Contextly')
  .action(() => {
    const { clearSession } = require('./auth');
    clearSession();
    console.log(chalk.green('✅ Logged out successfully.'));
  });

program.parse();
