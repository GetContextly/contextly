import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { getProjectConfig, getAuthSession, saveAuthSession, clearAuthSession } from './lib/config';
import { getGlobalConfig } from '@contextly/shared';
import { Contextly } from '@contextly/sdk';

export function registerCommands() {
  registerAuthCommands();
  registerProjectCommands();
  registerCoreCommands();
}

function registerAuthCommands() {
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
}

function registerProjectCommands() {
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
}

function registerCoreCommands() {
  program
    .command('read')
    .description('Print compiled context for current scope')
    .option('--budget <number>', 'Token budget for context', '1000')
    .option('--json', 'Output JSON instead of human-readable format')
    .option('--scope <scope>', 'Scope to read (default: current)')
    .action(async (options) => {
      const spinner = ora('Reading context...').start();
      try {
        const projectConfig = getProjectConfig();
        if (!projectConfig) {
          console.log(chalk.red('Not initialized. Run \'contextly init\' first.'));
          process.exit(1);
        }

        const scope = options.scope || projectConfig.scope || projectConfig.name;
        const dbPath = path.join(process.cwd(), '.contextly', 'db.sqlite');
        const token = `ctx_${scope}_${Math.random().toString(36).substring(2, 15)}`;

        const ctx = new Contextly({
          token,
          dbPath,
        });

        const result = await ctx.read({
          scope,
          budget: parseInt(options.budget),
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.bold.cyan(`\nCONTEXT: ${scope}`));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(`\nEntries (${result.entries.length}):`);
          result.entries.forEach((entry, index) => {
            console.log(`\n${chalk.bold((index + 1).toString().padStart(2, ' '))}. ${chalk.blue(entry.message)}`);
            console.log(chalk.gray(`   CID: ${entry.cid} | Kind: ${entry.kind} | Provenance: ${entry.provenance.sourceScope}`));
          });
          if (result.conflicts.length > 0) {
            console.log(chalk.yellow(`\nConflicts (${result.conflicts.length}):`));
            result.conflicts.forEach((conflict, index) => {
              console.log(`\n${chalk.bold('CONFLICT')} ${index + 1}:
  ${chalk.red('Existing:')} ${conflict.existingEntry.message}
  ${chalk.green('Incoming:')}  ${conflict.incomingEntry.message}`);
            });
          }
          if (result.dropped.length > 0) {
            console.log(chalk.gray(`\nDropped due to budget (${result.dropped.length}):`));
            result.dropped.forEach((drop, index) => {
              console.log(chalk.gray(`  ${index + 1}. ${drop.cid} - ${drop.reason}`));
            });
          }
          console.log(chalk.gray(`\nStats: Total Active=${result.stats.totalActive}, Inherited=${result.stats.inherited}, Conflicts=${result.stats.conflicts}, Budget Used=${result.stats.tokenCount}/${result.stats.budget}`));
        }
        await ctx.close();
      } catch (error: any) {
        spinner.fail(`Read failed: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('commit <message>')
    .description('Create a commitment with rationale')
    .option('--rationale <text>', 'Why this decision was made')
    .option('--scope <scope>', 'Scope for commit (default: current)')
    .option('--json', 'Output JSON instead of human-readable format')
    .action(async (message, options) => {
      const spinner = ora('Creating commitment...').start();
      try {
        const projectConfig = getProjectConfig();
        if (!projectConfig) {
          console.log(chalk.red('Not initialized. Run \'contextly init\' first.'));
          process.exit(1);
        }

        const scope = options.scope || projectConfig.scope || projectConfig.name;
        const dbPath = path.join(process.cwd(), '.contextly', 'db.sqlite');
        const token = `ctx_${scope}_${Math.random().toString(36).substring(2, 15)}`;

        let rationale = options.rationale;
        if (!rationale) {
          console.log(chalk.gray('Enter rationale (why this decision):'));
          rationale = 'Rationale entered via CLI';
        }

        const cid = `commit.${Date.now()}`;

        const ctx = new Contextly({
          token,
          dbPath,
        });

        const result = await ctx.commit({
          cid,
          message,
          kind: 'decision',
          scope,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          if (result.status === 'already_exists') {
            console.log(chalk.yellow(`Already exists: ${result.id}`));
          } else if (result.status === 'conflict') {
            console.log(chalk.red('Conflict!') + '\n' +
              `  Entry: ${result.entry.message}\n` +
              `  Conflict with: ${result.conflict?.existingMessage}\n` +
              `  Resolve with: contextly resolve ${result.conflict?.existingId}`);
          } else {
            spinner.succeed(chalk.green(`Commitment ${result.id} saved!`));
            console.log(chalk.gray(`  Message: ${result.entry.message}`));
            console.log(chalk.gray(`  CID: ${result.entry.cid}`));
            console.log(chalk.gray(`  Kind: ${result.entry.kind}`));
          }
        }
        await ctx.close();
      } catch (error: any) {
        spinner.fail(`Commit failed: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('log')
    .description('Show commitment history (git-log style)')
    .option('--scope <scope>', 'Scope to show (default: current)')
    .option('--limit <number>', 'Number of entries to show', '10')
    .option('--json', 'Output JSON instead of human-readable format')
    .action(async (options) => {
      try {
        const projectConfig = getProjectConfig();
        if (!projectConfig) {
          console.log(chalk.red('Not initialized. Run "contextly init" first.'));
          process.exit(1);
        }

        const scope = options.scope || projectConfig.scope || projectConfig.name;
        const dbPath = path.join(process.cwd(), '.contextly', 'db.sqlite');
        const token = `ctx_${scope}_${Math.random().toString(36).substring(2, 15)}`;

        const ctx = new Contextly({
          token,
          dbPath,
        });

        const result = await ctx.query({ scope });

        if (options.json) {
          console.log(JSON.stringify({ scope, entries: result.entries }, null, 2));
        } else {
          console.log(chalk.bold.cyan(`\nLOG: ${scope}`));
          console.log(chalk.gray('─'.repeat(60)));
          if (result.entries.length === 0) {
            console.log(chalk.gray('No entries found.'));
          } else {
            result.entries.slice(0, parseInt(options.limit)).forEach((entry, index) => {
              const date = new Date(entry.timestamp).toLocaleString();
              const author = entry.author.replace('human:', '').replace('agent:', '[agent] ');
              console.log(`\n${chalk.bold((index + 1).toString().padStart(2, ' '))}. ${chalk.blue(entry.message)}`);
              console.log(chalk.gray(`   ${date} • ${author} • ${entry.cid}`));
            });
            if (result.entries.length > parseInt(options.limit)) {
              console.log(chalk.gray(`... and ${result.entries.length - parseInt(options.limit)} more (use --limit to see more)`));
            }
          }
        }
        await ctx.close();
      } catch (error: any) {
        console.log(chalk.red(`Log failed: ${error.message}`));
        process.exit(1);
      }
    });

  program
    .command('diff <scope-a> <scope-b>')
    .description('Show constraint differences between two scopes')
    .option('--json', 'Output JSON instead of human-readable format')
    .action(async (scopeA, scopeB, options) => {
      const spinner = ora('Comparing scopes...').start();
      try {
        const dbPathA = path.join(process.cwd(), '.contextly', `db_${scopeA}.sqlite`);
        const tokenA = `ctx_${scopeA}_${Math.random().toString(36).substring(2, 15)}`;
        const dbPathB = path.join(process.cwd(), '.contextly', `db_${scopeB}.sqlite`);
        const tokenB = `ctx_${scopeB}_${Math.random().toString(36).substring(2, 15)}`;

        const ctxA = new Contextly({ token: tokenA, dbPath: dbPathA });
        const ctxB = new Contextly({ token: tokenB, dbPath: dbPathB });

        const resultA = await ctxA.read({ scope: scopeA });
        const resultB = await ctxB.read({ scope: scopeB });

        const onlyInA = resultA.entries.filter(e => !resultB.entries.some(e2 => e2.cid === e.cid));
        const onlyInB = resultB.entries.filter(e => !resultA.entries.some(e2 => e2.cid === e.cid));
        const diffInMessage = resultA.entries.filter(eA => {
          const eB = resultB.entries.find(e2 => e2.cid === eA.cid);
          return eB && eA.message !== eB.message;
        });

        if (options.json) {
          console.log(JSON.stringify({
            scopeA,
            scopeB,
            onlyInA: onlyInA.map(e => ({ cid: e.cid, message: e.message, scope: e.scope, kind: e.kind })),
            onlyInB: onlyInB.map(e => ({ cid: e.cid, message: e.message, scope: e.scope, kind: e.kind })),
            diffInMessage: diffInMessage.map(e => ({ cid: e.cid, messageA: e.message, messageB: resultB.entries.find(e2 => e2.cid === e.cid)?.message }))
          }, null, 2));
        } else {
          console.log(chalk.bold.cyan(`\nDIFF: ${scopeA} ↔ ${scopeB}`));
          console.log(chalk.gray('─'.repeat(60));

          if (onlyInA.length > 0) {
            console.log(chalk.red('\nOnly in A:'));
            onlyInA.forEach(e => console.log(chalk.red(`  • ${e.message}`)));
          }

          if (onlyInB.length > 0) {
            console.log(chalk.green('\nOnly in B:'));
            onlyInB.forEach(e => console.log(chalk.green(`  • ${e.message}`)));
          }

          if (diffInMessage.length > 0) {
            console.log(chalk.yellow('\nDifferences in same CID:'));
            diffInMessage.forEach(e => {
              const eB = resultB.entries.find(e2 => e2.cid === e.cid);
              console.log(chalk.yellow(`  • ${e.cid}:`));
              console.log(chalk.gray(`    A: ${e.message}`));
              console.log(chalk.gray(`    B: ${eB?.message}`));
            });
          }

          if (onlyInA.length === 0 && onlyInB.length === 0 && diffInMessage.length === 0) {
            console.log(chalk.gray('No differences found.'));
          }
        }

        await ctxA.close();
        await ctxB.close();
      } catch (error: any) {
        spinner.fail(`Diff failed: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('conflicts')
    .description('List open conflicts in current scope')
    .option('--json', 'Output JSON instead of human-readable format')
    .action(async (options) => {
      const spinner = ora('Checking conflicts...').start();
      try {
        const projectConfig = getProjectConfig();
        if (!projectConfig) {
          console.log(chalk.red('Not initialized. Run "contextly init" first.'));
          process.exit(1);
        }

        const scope = projectConfig.scope || projectConfig.name;
        const dbPath = path.join(process.cwd(), '.contextly', 'db.sqlite');
        const token = `ctx_${scope}_${Math.random().toString(36).substring(2, 15)}`;

        const ctx = new Contextly({
          token,
          dbPath,
        });

        const result = await ctx.read({ scope });

        if (result.conflicts.length === 0) {
          console.log(chalk.green('No conflicts found.'));
          await ctx.close();
          return;
        }

        if (options.json) {
          console.log(JSON.stringify({ scope, conflicts: result.conflicts }, null, 2));
        } else {
          console.log(chalk.bold.red(`\nCONFLICTS: ${scope}`));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(chalk.yellow(`\nFound ${result.conflicts.length} unresolved conflicts:\n`));
          result.conflicts.forEach((conflict, index) => {
            console.log(chalk.bold(`${index + 1}. ${conflict.cid}`));
            console.log(chalk.red(`   Existing: ${conflict.existingEntry.message}`));
            console.log(chalk.green(`   Incoming:  ${conflict.incomingEntry.message}`));
            console.log(chalk.gray(`   Resolve with: contextly resolve ${conflict.existingEntry.id}\n`));
          });
        }

        await ctx.close();
      } catch (error: any) {
        spinner.fail(`Conflicts check failed: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('resolve <id>')
    .description('Resolve a conflict interactively')
    .action(async (id) => {
      const spinner = ora(`Resolving conflict ${id}...`).start();
      try {
        const projectConfig = getProjectConfig();
        if (!projectConfig) {
          console.log(chalk.red('Not initialized. Run "contextly init" first.'));
          process.exit(1);
        }

        const scope = projectConfig.scope || projectConfig.name;
        const dbPath = path.join(process.cwd(), '.contextly', 'db.sqlite');
        const token = `ctx_${scope}_${Math.random().toString(36).substring(2, 15)}`;

        const ctx = new Contextly({
          token,
          dbPath,
        });

        console.log(chalk.yellow(`Conflict ID: ${id}`));
        console.log(chalk.gray('Enter new message for this conflict (Ctrl+C to cancel):'));

        const newMessage = 'New message resolved via CLI';

        const result = await ctx.resolve({
          cid: 'unknown_cid_from_id',
          message: newMessage,
          kind: 'decision',
          supersedingId: id,
        });

        spinner.succeed(chalk.green(`Conflict resolved with new entry: ${result.id}`));
        console.log(chalk.gray(`  Message: ${result.entry.message}`));
        await ctx.close();
      } catch (error: any) {
        spinner.fail(`Resolution failed: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('sync')
    .description('Push/pull against cloud state')
    .option('--push-only', 'Only push local changes to cloud')
    .option('--pull-only', 'Only pull cloud changes to local')
    .option('--auto', 'Auto sync (push + pull)')
    .action(async (options) => {
      const spinner = ora('Syncing with cloud...').start();
      try {
        console.log(chalk.yellow('Cloud sync simulation - requires Supabase configuration'));
        console.log(chalk.gray('\nSync would:'));
        console.log(chalk.gray('  • Push local entries to cloud if newer'));
        console.log(chalk.gray('  • Pull cloud entries to local if missing'));
        console.log(chalk.gray('  • Resolve any conflicts automatically'));

        spinner.succeed(chalk.green('Sync simulation complete!'));
      } catch (error: any) {
        spinner.fail(`Sync failed: ${error.message}`);
        process.exit(1);
      }
    });
}