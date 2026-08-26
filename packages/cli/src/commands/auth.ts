import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { initiateDeviceFlow, pollForToken, getGitHubUser } from './auth';
import { saveAuthSession, getAuthSession, clearAuthSession } from './utils';
import { getServiceKey } from './utils';

export function registerCommands() {
  // Login command
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

  // Logout command
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

  // Whoami command
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