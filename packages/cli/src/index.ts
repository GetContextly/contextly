#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import SingleBar from 'cli-progress';
const Table = require('terminal-table');
import fs from 'fs';
import path from 'path';

import { scanDirectory, getRecentCommits, getRemoteUrl } from './scanner';
import { analyzeDiff } from './analyzer';
import { ensureDir, writeJson, getSupabase, getProjectConfig, getAuthSession, saveAuthSession, clearAuthSession } from './utils';
import { CLI_INFO } from '@contextly/shared';
import { initiateDeviceFlow, pollForToken, getGitHubUser } from './auth';

const program = new Command();

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(chalk.gray(question));
    process.stdin.setEncoding('utf-8');
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim());
    });
    process.stdin.resume();
  });
}

// ============= Auth Commands =============
program
  .command('login')
  .description('Authenticate with GitHub (Device Flow)')
  .action(async () => {
    const existing = getAuthSession();
    if (existing) {
      console.log(chalk.yellow(`Already logged in as ${existing.user.login || existing.user.email}.`));
      console.log(chalk.gray('Run "contextly logout" first to switch accounts.'));
      return;
    }

    const spinner = ora('Starting GitHub authentication...').start();
    try {
      const { device_code, verification_uri, interval } = await initiateDeviceFlow();

      spinner.stop();
      console.log(chalk.bold('\nTo authenticate, open:'));
      console.log(chalk.cyan(`  ${verification_uri}`));
      console.log(chalk.bold('\nAnd enter this code:'));
      console.log(chalk.yellow(`  ${device_code}\n`));

      const pollSpinner = ora('Waiting for authorization...').start();
      const accessToken = await pollForToken(device_code, interval || 5);

      pollSpinner.text = 'Fetching GitHub profile...';
      const ghUser: any = await getGitHubUser(accessToken);

      const serviceKey = getServiceKey();
      if (serviceKey) {
        const supabase = getSupabase(serviceKey);
        await supabase.from('profiles').upsert(
          {
            id: ghUser.id.toString(),
            full_name: ghUser.name || ghUser.login,
            avatar_url: ghUser.avatar_url,
          },
          { onConflict: 'id' }
        );
      }

      saveAuthSession({
        accessToken,
        user: {
          id: ghUser.id.toString(),
          email: ghUser.email,
          login: ghUser.login,
        },
      });

      pollSpinner.succeed(chalk.green(`Logged in as ${chalk.bold(ghUser.login)}`));
    } catch (err: any) {
      spinner.fail(`Login failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Clear local authentication session')
  .action(() => {
    const session = getAuthSession();
    if (!session) {
      console.log(chalk.yellow('Not logged in.'));
      return;
    }
    clearAuthSession();
    console.log(chalk.green(`Logged out of ${session.user.login || session.user.email}.`));
  });

program
  .command('whoami')
  .description('Show current authenticated user')
  .action(() => {
    const session = getAuthSession();
    if (!session) {
      console.log(chalk.yellow('Not logged in. Run "contextly login" first.'));
      return;
    }
    console.log(chalk.bold.cyan('\nAuthenticated User'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.bold('Login:')}    ${chalk.white(session.user.login || 'N/A')}`);
    console.log(`  ${chalk.bold('Email:')}    ${chalk.white(session.user.email || 'N/A')}`);
    console.log(`  ${chalk.bold('User ID:')}  ${chalk.gray(session.user.id)}`);
    console.log();
  });

// ================== Project Commands ===================

program
  .command('init')
  .description('Initialize Contextly in the current directory')
  .option('--yes', 'Skip confirmation prompts')
  .option('--scope <scope>', 'Scope for project (e.g., "project.myapp")')
  .action(async (options) => {
    const spinner = ora('Initializing Contextly...').start();
    try {
      let session = getAuthSession();
      if (!session) {
        spinner.stop();
        console.log(chalk.yellow('Not authenticated. Starting GitHub login...'));
        console.log(chalk.gray('(This only happens once — session is saved globally)\n'));

        const { device_code, verification_uri, interval } = await initiateDeviceFlow();
        console.log(chalk.bold('Open:'));
        console.log(chalk.cyan(`  ${verification_uri}`));
        console.log(chalk.bold('\nEnter this code:'));
        console.log(chalk.yellow(`  ${device_code}\n`));

        const pollSpinner = ora('Waiting for authorization...').start();
        const accessToken = await pollForToken(device_code, interval || 5);
        pollSpinner.text = 'Fetching GitHub profile...';
        const ghUser: any = await getGitHubUser(accessToken);

        const serviceKey = getServiceKey();
        if (serviceKey) {
          const supabase = getSupabase(serviceKey);
          await supabase.from('profiles').upsert(
            {
              id: ghUser.id.toString(),
              full_name: ghUser.name || ghUser.login,
              avatar_url: ghUser.avatar_url,
            },
            { onConflict: 'id' }
          );
        }

        saveAuthSession({
          accessToken,
          user: { id: ghUser.id.toString(), email: ghUser.email, login: ghUser.login },
        });
        pollSpinner.succeed(chalk.green(`Authenticated as ${chalk.bold(ghUser.login)}`));
        session = getAuthSession();
        spinner.start();
      }

      const projectConfig = getProjectConfig();
      if (projectConfig && !options.yes) {
        console.log(chalk.yellow(`Already initialized for "${projectConfig.name}"`));
        console.log(chalk.gray('Re-initializing will create a new project linking to this repo.\n'));
        console.log(chalk.gray('(Proceeding automatically due to --yes)\n'));
      }

      const scope = options.scope || 'project.current';

      ensureDir(path.join(process.cwd(), '.contextly'));
      writeJson(path.join(process.cwd(), '.contextly', 'config.json'), {
        projectId: 'mock-project-id',
        name: scope,
        scope
      });
      writeJson(path.join(process.cwd(), '.contextly', 'mcp.json'), {
        mcpToken: `ctx_${scope}_${Math.random().toString(36).substring(2, 15)}`,
        projectId: 'mock-project-id'
      });

      spinner.succeed(chalk.green(`Contextly initialized for ${chalk.bold(scope)}!`));
      console.log(chalk.gray(`\nScope: ${scope}`));
      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.white('  1. contextly sync          - Ingest git history'));
      console.log(chalk.white('  2. contextly read           - View compiled context'));
      console.log(chalk.white('  3. contextly commit         - Add a decision'));
    } catch (error: any) {
      spinner.fail(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('sync')
  .description('Sync git history into project memory')
  .option('--limit <number>', 'Number of commits to analyze', '50')
  .option('--force', 'Skip freshness check')
  .action(async (options) => {
    const session = getAuthSession();
    if (!session) {
      console.log(chalk.red('Not authenticated.'));
      console.log(chalk.gray('  Run "contextly login" to authenticate with GitHub.'));
      process.exit(1);
    }

    const configPath = path.join(process.cwd(), '.contextly', 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log(chalk.red('Project not initialized.'));
      console.log(chalk.gray('  Run "contextly init" in your project directory first.'));
      process.exit(1);
    }

    const { projectId } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const commits = getRecentCommits(process.cwd(), parseInt(options.limit));

    if (commits.length === 0) {
      console.log(chalk.yellow('No commits found in this repository.'));
      return;
    }

    console.log(chalk.blue(`\nAnalyzing ${commits.length} commits...\n`));

    const progressBar = new SingleBar.SingleBar({
      format: 'Syncing |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    progressBar.start(commits.length, 0);
    const supabase = getSupabase(getServiceKey());

    const allChanges: any[] = [];
    const allDecisions: any[] = [];

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];

      allChanges.push({
        project_id: projectId,
        summary: commit.message.substring(0, 1000),
        commit_sha: commit.sha,
        created_at: new Date(commit.date).toISOString(),
      });

      const decision = analyzeDiff(process.cwd(), commit.sha);
      if (decision) {
        allDecisions.push({
          project_id: projectId,
          summary: decision.summary.substring(0, 1000),
          reasoning: decision.reasoning.substring(0, 5000),
          source: 'git_commit',
          related_files: decision.relatedFiles.slice(0, 100),
          created_at: new Date(commit.date).toISOString(),
        });
      }
      progressBar.update(i + 1);
    }
    progressBar.stop();

    const spinner = ora('Pushing to Contextly cloud...').start();

    const [changesRes, decRes] = await Promise.all([
      supabase.from('changes').upsert(allChanges, { onConflict: 'project_id,commit_sha' }),
      supabase.from('decisions').upsert(allDecisions, { onConflict: 'project_id,summary' }),
    ]);

    if (changesRes.error) {
      spinner.fail(`Changes sync failed: ${changesRes.error.message}`);
      process.exit(1);
    }
    if (decRes.error) {
      spinner.fail(`Decisions sync failed: ${decRes.error.message}`);
      process.exit(1);
    }

    spinner.succeed(chalk.green('Sync complete!'));
    console.log(chalk.gray(`  Changes tracked:    ${allChanges.length}`));
    console.log(chalk.gray(`  Decisions extracted: ${allDecisions.length}`));
  });

// ================== Core Contextly Commands ==================

import('./commands/index').then(module => module.registerCommands());

program
  .name(CLI_INFO.NAME)
  .description(CLI_INFO.DESCRIPTION)
  .version(CLI_INFO.VERSION);

program.parse(process.argv);