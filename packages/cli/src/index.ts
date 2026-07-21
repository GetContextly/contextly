#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { randomBytes } from 'crypto';
import { scanDirectory, getRecentCommits, getRemoteUrl } from './scanner';
import { analyzeDiff } from './analyzer';
import fs from 'fs';
import path from 'path';
import { ensureDir, writeJson, getSupabase } from './utils';
import { CLI_INFO } from '@contextly/shared';
import {
  initiateDeviceFlow,
  pollForToken,
  getGitHubUser,
  saveSession,
  clearSession,
  getSession,
} from './auth';
import ora from 'ora';
import SingleBar from 'cli-progress';
const Table = require('terminal-table');

const program = new Command();

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

program
  .name(CLI_INFO.NAME)
  .description('Persistent AI project memory — universal context across all coding agents')
  .version(CLI_INFO.VERSION);

// ─── login ────────────────────────────────────────────────────
program
  .command('login')
  .description('Authenticate with GitHub (Device Flow)')
  .action(async () => {
    const existing = getSession();
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

      // Upsert Supabase profile so the user has an ID we can reference
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

      saveSession({
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

// ─── logout ───────────────────────────────────────────────────
program
  .command('logout')
  .description('Clear local authentication session')
  .action(() => {
    const session = getSession();
    if (!session) {
      console.log(chalk.yellow('Not logged in.'));
      return;
    }
    clearSession();
    console.log(chalk.green(`Logged out of ${session.user.login || session.user.email}.`));
  });

// ─── init ─────────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize Contextly in the current directory')
  .option('--yes', 'Skip confirmation prompts')
  .action(async (opts) => {
    const spinner = ora('Initializing Contextly...').start();
    try {
      // Auto-prompt login if no session
      let session = getSession();
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

        saveSession({
          accessToken,
          user: { id: ghUser.id.toString(), email: ghUser.email, login: ghUser.login },
        });
        pollSpinner.succeed(chalk.green(`Authenticated as ${chalk.bold(ghUser.login)}`));
        session = getSession();
        spinner.start();
      }

      spinner.text = 'Scanning repository...';
      const info = scanDirectory(process.cwd());
      const remoteUrl = getRemoteUrl(process.cwd());

      // Check for existing project
      const configDir = path.join(process.cwd(), '.contextly');
      const existingConfig = path.join(configDir, 'config.json');
      if (fs.existsSync(existingConfig) && !opts.yes) {
        spinner.stop();
        const existing = JSON.parse(fs.readFileSync(existingConfig, 'utf-8'));
        console.log(chalk.yellow(`Contextly already initialized for "${existing.name}".`));
        console.log(chalk.gray('Re-initializing will create a new project linking to this repo.\n'));
        const proceed = await prompt(`Continue? (y/N) `);
        if (proceed.toLowerCase() !== 'y') {
          console.log(chalk.gray('Aborted.'));
          return;
        }
        spinner.start();
      }

      ensureDir(configDir);

      const mcpToken = 'ctx_' + randomBytes(32).toString('hex');
      spinner.text = 'Creating project in Contextly cloud...';

      const serviceKey = getServiceKey();
      const supabase = getSupabase(serviceKey);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: info.name,
          mcp_token: mcpToken,
          owner_id: session!.user.id,
          github_repo_url: remoteUrl,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      writeJson(path.join(configDir, 'config.json'), { projectId: data.id, name: info.name });
      writeJson(path.join(configDir, 'mcp.json'), { mcpToken, projectId: data.id });

      spinner.succeed(chalk.green(`Contextly initialized for ${chalk.bold(info.name)}!`));
      console.log(chalk.gray(`\nProject ID: ${data.id}`));
      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.white('  1. Run "contextly sync" to ingest git history'));
      console.log(chalk.white('  2. Configure your MCP client to use .contextly/mcp.json'));
    } catch (error: any) {
      spinner.fail(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  });

// ─── sync ─────────────────────────────────────────────────────
program
  .command('sync')
  .description('Sync git history into project memory')
  .option('--limit <number>', 'Number of commits to analyze', '50')
  .option('--force', 'Skip freshness check')
  .action(async (options) => {
    const session = getSession();
    if (!session) return console.log(chalk.red('Not authenticated. Run "contextly login" first.'));

    const configPath = path.join(process.cwd(), '.contextly', 'config.json');
    if (!fs.existsSync(configPath))
      return console.log(chalk.red('Project not initialized. Run "contextly init" first.'));

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

// ─── log ──────────────────────────────────────────────────────
program
  .command('log <message>')
  .description('Log an architectural decision')
  .option('--reasoning <text>', 'Why this decision was made')
  .action(async (message, options) => {
    const session = getSession();
    if (!session) return console.log(chalk.red('Not authenticated. Run "contextly login" first.'));

    const configPath = path.join(process.cwd(), '.contextly', 'config.json');
    if (!fs.existsSync(configPath))
      return console.log(chalk.red('Project not initialized. Run "contextly init" first.'));

    const { projectId } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    let reasoning = options.reasoning;
    if (!reasoning) {
      // Interactive prompt
      reasoning = await prompt('Reasoning (why this decision): ');
      if (!reasoning.trim()) {
        console.log(chalk.red('Reasoning is required.'));
        process.exit(1);
      }
    }

    const spinner = ora('Logging decision...').start();
    const supabase = getSupabase(getServiceKey());

    const { data, error } = await supabase
      .from('decisions')
      .insert({
        project_id: projectId,
        summary: message,
        reasoning,
        source: 'manual',
        related_files: [],
      })
      .select('id, created_at')
      .single();

    if (error) {
      spinner.fail(`Failed to log decision: ${error.message}`);
      process.exit(1);
    }

    spinner.succeed(chalk.green('Decision logged!'));
    console.log(chalk.gray(`  ID: ${data.id}`));
    console.log(chalk.gray(`  Time: ${data.created_at}`));
  });

// ─── status ───────────────────────────────────────────────────
program
  .command('status')
  .description('Show project memory status')
  .action(async () => {
    const spinner = ora('Fetching status...').start();
    try {
      const configPath = path.join(process.cwd(), '.contextly', 'config.json');
      if (!fs.existsSync(configPath)) {
        spinner.warn('Not in a Contextly project. Run "contextly init" first.');
        return;
      }
      const { projectId, name } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const supabase = getSupabase(getServiceKey());

      const { data: statsData } = await supabase
        .from('project_stats')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: recentDecisions } = await supabase
        .from('decisions')
        .select('summary, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

      spinner.stop();
      console.log(chalk.bold.cyan(`\n${name} STATUS`));
      console.log(chalk.gray(`Project ID: ${projectId}\n`));

      const stats = new Table();
      stats.push([chalk.bold('Metric'), chalk.bold('Value')]);
      stats.push(['Commits Tracked', statsData?.change_count || 0]);
      stats.push(['Decisions Logged', statsData?.decision_count || 0]);
      stats.push([
        'Last Sync',
        statsData?.last_sync_at
          ? new Date(statsData.last_sync_at).toLocaleString()
          : 'Never',
      ]);
      console.log(stats.toString());

      if (recentDecisions && recentDecisions.length > 0) {
        console.log(chalk.bold('\nRecent Decisions:'));
        recentDecisions.forEach((d) => {
          console.log(
            `  ${chalk.green('>')} ${chalk.white(d.summary)} ${chalk.gray(
              '(' + new Date(d.created_at).toLocaleDateString() + ')'
            )}`
          );
        });
      }
    } catch (e: any) {
      spinner.fail(`Status failed: ${e.message}`);
    }
  });

// ─── Helpers ──────────────────────────────────────────────────
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

program.parse(process.argv);
