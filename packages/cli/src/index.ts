#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('contextly')
  .description('CLI to manage your project context')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Contextly in the current directory')
  .action(() => {
    console.log(chalk.green('Initializing Contextly...'));
  });

program
  .command('auth')
  .description('Authenticate with Contextly')
  .action(() => {
    console.log(chalk.blue('Authenticating...'));
  });

program.parse();
