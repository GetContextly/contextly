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
  .description('Sync changes and extract semantic intent')
  .option('--limit <number>', 'Commits to analyze', '20')
  .action(async (options) => {
    const session = getSession();
    if (!session) {
      console.log(chalk.red('❌ Please login first.'));
      return;
    }

    const configPath = path.join(process.cwd(), '.contextly', 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log(chalk.red('❌ Project not initialized.'));
      return;
    }

    const { projectId } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const commits = getRecentCommits(process.cwd(), parseInt(options.limit));

    console.log(chalk.blue(`\n🔄 Syncing ${commits.length} commits...`));

    const progressBar = new SingleBar.SingleBar({
      format: 'Analyzing |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Commits',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(commits.length, 0);
    const serviceKey = getServiceKey();
    const supabase = getSupabase(serviceKey);

    let decisionsFound = 0;
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      // Sync raw change
      await supabase.from('changes').upsert({
        project_id: projectId,
        summary: commit.message,
        commit_sha: commit.sha,
        created_at: new Date(commit.date).toISOString()
      }, { onConflict: 'project_id,commit_sha' });

      // Semantic analysis
      const decision = analyzeDiff(process.cwd(), commit.sha);
      if (decision) {
        await supabase.from('decisions').upsert({
          project_id: projectId,
          summary: decision.summary,
          reasoning: decision.reasoning,
          source: 'git_commit',
          related_files: decision.relatedFiles,
          created_at: new Date(commit.date).toISOString()
        }, { onConflict: 'project_id,summary' });
        decisionsFound++;
      }
      progressBar.update(i + 1);
    }
    progressBar.stop();

    console.log(chalk.green(`\n✅ Sync complete! Identified ${chalk.bold(decisionsFound)} architectural decisions.`));
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
      const serviceKey = getServiceKey();
      const supabase = getSupabase(serviceKey);

      const [decisions, changes] = await Promise.all([
        supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5),
        supabase.from('changes').select('id', { count: 'exact' }).eq('project_id', projectId)
      ]);

      spinner.stop();
      console.log(chalk.bold.cyan(`\n◈ ${name.toUpperCase()} STATUS`));
      console.log(chalk.gray(`Project ID: ${projectId}\n`));

      const stats = new Table();
      stats.push([chalk.bold('Metric'), chalk.bold('Value')]);
      stats.push(['Total Commits Tracked', changes.count || 0]);
      stats.push(['Decisions Logged', (decisions.data?.length || 0) + '+']);
      console.log(stats.toString());

      if (decisions.data && decisions.data.length > 0) {
        console.log(chalk.bold('\nRecent Decisions:'));
        decisions.data.forEach(d => {
          console.log(`${chalk.green('✔')} ${chalk.white(d.summary)} ${chalk.gray('(' + new Date(d.created_at).toLocaleDateString() + ')')}`);
        });
      }
    } catch (e: any) {
      spinner.fail(`Status failed: ${e.message}`);
    }
  });

program
  .command('doctor')
  .description('Check health of local environment and configuration')
  .action(() => {
    console.log(chalk.bold('\n🏥 Contextly Doctor\n'));

    const checks = [
      { name: 'Git Installed', pass: !!require('child_process').execSync('git --version') },
      { name: 'Auth Session', pass: !!getSession() },
      { name: 'Environment Keys', pass: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
      { name: 'Project Link', pass: fs.existsSync('.contextly/config.json') }
    ];

    checks.forEach(c => {
      console.log(`${c.pass ? chalk.green('✓') : chalk.red('✗')} ${c.name}`);
    });

    if (checks.every(c => c.pass)) {
      console.log(chalk.green('\nEverything looks good! Keep shipping.'));
    } else {
      console.log(chalk.yellow('\nSome checks failed. Please resolve them to ensure full functionality.'));
    }
  });

program.parse(process.argv);
