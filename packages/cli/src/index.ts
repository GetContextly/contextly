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

const program = new Command();

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

program
  .name(CLI_INFO.NAME)
  .description('CLI to manage your project context')
  .version(CLI_INFO.VERSION);

program
  .command('init')
  .description('Initialize Contextly in the current directory')
  .option('--yes', 'Skip confirmation prompts')
  .action(async () => {
    try {
      const session = getSession();
      if (!session) {
        console.error(chalk.red('❌ Not authenticated. Run "contextly auth" first.'));
        process.exit(1);
      }

      console.log(chalk.green('🔍 Scanning repository...'));
      const info = scanDirectory(process.cwd());
      const remoteUrl = getRemoteUrl(process.cwd());

      console.log(chalk.cyan(`Project Name: ${info.name}`));
      if (remoteUrl) {
        console.log(chalk.gray(`Found Remote: ${remoteUrl}`));
      }

      const configDir = path.join(process.cwd(), '.contextly');
      ensureDir(configDir);

      // Generate a cryptographically secure MCP token
      const mcpToken = 'ctx_' + randomBytes(32).toString('hex');

      console.log(chalk.yellow('🚀 Linking to Contextly cloud...'));

      const serviceKey = getServiceKey();
      if (!serviceKey) {
        console.error(chalk.red('❌ SUPABASE_SERVICE_ROLE_KEY not set. Cannot create project.'));
        process.exit(1);
      }

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

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      // .contextly/config.json — safe to commit, no secrets
      const config = {
        projectId: data.id,
        name: info.name,
        updatedAt: new Date().toISOString(),
      };
      writeJson(path.join(configDir, 'config.json'), config);

      // .contextly/mcp.json — gitignored, contains the secret token
      const mcpConfig = {
        mcpToken,
        mcpServerUrl: process.env.MCP_SERVER_PUBLIC_URL || 'https://mcp.getcontextly.dev',
        projectId: data.id,
      };
      writeJson(path.join(configDir, 'mcp.json'), mcpConfig);

      // Ensure mcp.json is gitignored
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignoreEntry = '.contextly/mcp.json';
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        if (!content.includes(gitignoreEntry)) {
          fs.appendFileSync(gitignorePath, `\n${gitignoreEntry}\n`);
        }
      } else {
        fs.writeFileSync(gitignorePath, `${gitignoreEntry}\n`);
      }

      console.log(chalk.green('\n✨ Contextly initialized!'));
      console.log(`${chalk.gray('Project ID:')} ${data.id}`);
      console.log(`${chalk.gray('MCP Token saved to:')} .contextly/mcp.json ${chalk.yellow('(gitignored)')} `);
      console.log(`\n${chalk.blue('Next steps:')}`);
      console.log(`1. Add the MCP server config to your AI agent.`);
      console.log(`2. Run ${chalk.yellow('contextly sync')} to push your recent commits.`);
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Initialization failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('auth')
  .description('Authenticate with Contextly via GitHub')
  .action(async () => {
    try {
      console.log(chalk.blue('🔒 Starting GitHub Authentication...'));
      const deviceFlow = await initiateDeviceFlow();

      console.log('\n-----------------------------------------');
      console.log(`1. Open: ${chalk.cyan(deviceFlow.verification_uri)}`);
      console.log(`2. Enter code: ${chalk.yellow.bold(deviceFlow.user_code)}`);
      console.log('-----------------------------------------\n');

      console.log(chalk.gray('Waiting for authorization...'));
      const token = await pollForToken(deviceFlow.device_code, deviceFlow.interval);

      const user = await getGitHubUser(token);
      const session = {
        accessToken: token,
        user: {
          id: user.id.toString(),
          email: user.email || '',
          login: user.login,
        },
      };

      saveSession(session);
      console.log(chalk.green(`✨ Welcome, ${user.login}! You are now authenticated.`));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Authentication failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Log out from Contextly')
  .action(() => {
    clearSession();
    console.log(chalk.green('✅ Logged out successfully.'));
  });

program
  .command('sync')
  .description('Sync recent git changes and architectural decisions')
  .option('--limit <number>', 'Number of commits to sync', '20')
  .action(async (options: { limit: string }) => {
    try {
      const session = getSession();
      if (!session) {
        console.error(chalk.red('❌ Not authenticated. Run "contextly auth" first.'));
        process.exit(1);
      }

      const configPath = path.join(process.cwd(), '.contextly', 'config.json');
      if (!fs.existsSync(configPath)) {
        throw new Error('Project not initialized. Run "contextly init" first.');
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const { projectId } = config;

      console.log(chalk.blue('🔄 Syncing changes...'));

      const limit = parseInt(options.limit);
      const commits = getRecentCommits(process.cwd(), limit);
      const serviceKey = getServiceKey();
      const supabase = getSupabase(serviceKey);

      console.log(chalk.gray(`Found ${commits.length} recent commits.`));

      if (commits.length === 0) {
        console.log(chalk.yellow('No commits to sync.'));
        return;
      }

      // 1. Sync raw changes
      const { error: syncError } = await supabase
        .from('changes')
        .upsert(
          commits.map((c) => ({
            project_id: projectId,
            summary: c.message,
            commit_sha: c.sha,
            created_at: new Date(c.date).toISOString(),
          })),
          { onConflict: 'project_id,commit_sha', ignoreDuplicates: true }
        );

      if (syncError) throw new Error(`Sync failed: ${syncError.message}`);

      // 2. Analyze for decisions
      console.log(chalk.blue('🧠 Analyzing commits for architectural decisions...'));
      let decisionCount = 0;
      for (const commit of commits) {
        const decision = analyzeDiff(process.cwd(), commit.sha);
        if (decision) {
          const { error: decError } = await supabase
            .from('decisions')
            .upsert({
              project_id: projectId,
              summary: decision.summary,
              reasoning: decision.reasoning,
              source: 'git_commit',
              related_files: decision.relatedFiles,
              created_at: new Date(commit.date).toISOString(),
            }, { onConflict: 'project_id,summary' }); // Basic deduplication on summary for now

          if (!decError) decisionCount++;
        }
      }

      console.log(chalk.green(`✅ Synced ${commits.length} commits and identified ${decisionCount} decisions!`));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Sync failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show the current project status and context stats')
  .action(async () => {
    try {
      const configPath = path.join(process.cwd(), '.contextly', 'config.json');
      if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow('Project not initialized in this directory.'));
        return;
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const serviceKey = getServiceKey();
      const supabase = getSupabase(serviceKey);

      console.log(chalk.bold(`\nProject: ${config.name}`));
      console.log(chalk.gray(`ID: ${config.projectId}\n`));

      const [decisions, changes] = await Promise.all([
        supabase.from('decisions').select('id', { count: 'exact' }).eq('project_id', config.projectId),
        supabase.from('changes').select('id', { count: 'exact' }).eq('project_id', config.projectId)
      ]);

      console.log(`${chalk.cyan('Decisions Logged:')} ${decisions.count || 0}`);
      console.log(`${chalk.cyan('Changes Tracked:')}  ${changes.count || 0}`);

      const session = getSession();
      console.log(`\n${chalk.gray('Auth Status:')} ${session ? chalk.green('Logged in as ' + session.user.login) : chalk.red('Not logged in')}`);
    } catch (error: any) {
      console.error(chalk.red(`Error fetching status: ${error.message}`));
    }
  });

program
  .command('log <message>')
  .description('Log a project decision manually')
  .option('--reasoning <text>', 'The reasoning behind the decision')
  .option('--files <files>', 'Comma-separated list of related files')
  .action(async (message: string, options: { reasoning?: string; files?: string }) => {
    try {
      const mcpConfigPath = path.join(process.cwd(), '.contextly', 'mcp.json');
      if (!fs.existsSync(mcpConfigPath)) {
        throw new Error('Project not initialized.');
      }

      const { projectId } = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      const serviceKey = getServiceKey();
      const supabase = getSupabase(serviceKey);

      const relatedFiles = options.files ? options.files.split(',').map((f) => f.trim()) : [];

      const { data, error } = await supabase
        .from('decisions')
        .insert({
          project_id: projectId,
          summary: message,
          reasoning: options.reasoning || '',
          source: 'manual',
          related_files: relatedFiles,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      console.log(chalk.green('✅ Decision logged successfully.'));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Log failed: ${error.message}`));
    }
  });

program.parse(process.argv);
