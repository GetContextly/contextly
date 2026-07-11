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
import { initiateDeviceFlow, pollForToken, getGitHubUser, saveSession, clearSession, getSession } from './auth';
import ora from 'ora';
import SingleBar from 'cli-progress';
const Table = require('terminal-table');

const program = new Command();

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

program
  .name(CLI_INFO.NAME)
  .description('Elite CLI for persistent AI project memory')
  .version(CLI_INFO.VERSION);

program
  .command('init')
  .description('Initialize Contextly in the current directory')
  .action(async () => {
    const spinner = ora('Initializing Contextly...').start();
    try {
      const session = getSession();
      if (!session) {
        spinner.fail('Not authenticated. Run "contextly auth" first.');
        process.exit(1);
      }

      spinner.text = 'Scanning repository...';
      const info = scanDirectory(process.cwd());
      const remoteUrl = getRemoteUrl(process.cwd());

      const configDir = path.join(process.cwd(), '.contextly');
      ensureDir(configDir);

      const mcpToken = 'ctx_' + randomBytes(32).toString('hex');
      spinner.text = 'Linking to Contextly cloud...';

      const serviceKey = getServiceKey();
      const supabase = getSupabase(serviceKey);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: info.name,
          mcp_token: mcpToken,
          owner_id: session.user.id,
          github_repo_url: remoteUrl,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      writeJson(path.join(configDir, 'config.json'), { projectId: data.id, name: info.name });
      writeJson(path.join(configDir, 'mcp.json'), { mcpToken, projectId: data.id });

      spinner.succeed(chalk.green(`Contextly initialized for ${chalk.bold(info.name)}!`));
      console.log(chalk.gray(`\nProject ID: ${data.id}`));
      console.log(chalk.blue('\nNext: Run "contextly sync" to populate project memory.'));
    } catch (error: any) {
      spinner.fail(`Initialization failed: ${error.message}`);
    }
  });

program
  .command('sync')
  .description('High-performance batched sync for architectural intent')
  .option('--limit <number>', 'Commits to analyze', '50')
  .option('--batch-size <number>', 'Number of items per DB request', '100')
  .action(async (options) => {
    const session = getSession();
    if (!session) return console.log(chalk.red('❌ Please login first.'));

    const configPath = path.join(process.cwd(), '.contextly', 'config.json');
    if (!fs.existsSync(configPath)) return console.log(chalk.red('❌ Project not initialized.'));

    const { projectId } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const commits = getRecentCommits(process.cwd(), parseInt(options.limit));

    console.log(chalk.blue(`\n🔄 Scaling Ingestion: Analyzing ${commits.length} commits...`));

    const progressBar = new SingleBar.SingleBar({
      format: 'Ingesting |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Commits',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(commits.length, 0);
    const supabase = getSupabase(getServiceKey());

    // 1. Process commits in chunks to identify decisions
    const allChanges = [];
    const allDecisions = [];

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];

      allChanges.push({
        project_id: projectId,
        summary: commit.message.substring(0, 1000), // Limit length (CSEC-005)
        commit_sha: commit.sha,
        created_at: new Date(commit.date).toISOString()
      });

      const decision = analyzeDiff(process.cwd(), commit.sha);
      if (decision) {
        allDecisions.push({
          project_id: projectId,
          summary: decision.summary.substring(0, 1000), // Limit length
          reasoning: decision.reasoning.substring(0, 5000), // Limit length
          source: 'git_commit',
          related_files: decision.relatedFiles.slice(0, 100), // Limit file count
          created_at: new Date(commit.date).toISOString()
        });
      }
      progressBar.update(i + 1);
    }
    progressBar.stop();

    const spinner = ora('Pushing data to cloud...').start();

    // 2. Batched Upsert (SCALING FIX: Avoid N+1 requests)
    const [changesRes, decRes] = await Promise.all([
      supabase.from('changes').upsert(allChanges, { onConflict: 'project_id,commit_sha' }),
      supabase.from('decisions').upsert(allDecisions, { onConflict: 'project_id,summary' })
    ]);

    if (changesRes.error || decRes.error) {
      spinner.fail('Sync failed during cloud push.');
    } else {
      spinner.succeed(chalk.green(`\n✅ Scalable Sync Complete!`));
      console.log(chalk.gray(`  - Changes Tracked:  ${allChanges.length}`));
      console.log(chalk.gray(`  - Decisions Extracted: ${allDecisions.length}`));
    }
  });

program
  .command('status')
  .description('Show deep-dive status of project memory')
  .action(async () => {
    const spinner = ora('Fetching status...').start();
    try {
      const configPath = path.join(process.cwd(), '.contextly', 'config.json');
      if (!fs.existsSync(configPath)) {
        spinner.warn('Not in a Contextly project.');
        return;
      }
      const { projectId, name } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const supabase = getSupabase(getServiceKey());

      // SCALING FIX: Query the project_stats table instead of aggregate counts
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
      console.log(chalk.bold.cyan(`\n◈ ${name.toUpperCase()} STATUS`));
      console.log(chalk.gray(`Project ID: ${projectId}\n`));

      const stats = new Table();
      stats.push([chalk.bold('Metric'), chalk.bold('Value')]);
      stats.push(['Total Commits Tracked', statsData?.change_count || 0]);
      stats.push(['Decisions Logged', statsData?.decision_count || 0]);
      stats.push(['Last Sync', statsData?.last_sync_at ? new Date(statsData.last_sync_at).toLocaleString() : 'Never']);
      console.log(stats.toString());

      if (recentDecisions && recentDecisions.length > 0) {
        console.log(chalk.bold('\nRecent Architectural Decisions:'));
        recentDecisions.forEach(d => {
          console.log(`${chalk.green('✔')} ${chalk.white(d.summary)} ${chalk.gray('(' + new Date(d.created_at).toLocaleDateString() + ')')}`);
        });
      }
    } catch (e: any) {
      spinner.fail(`Status failed: ${e.message}`);
    }
  });

program.parse(process.argv);
