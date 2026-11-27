/**
 * List emails from the configured mail providers (read-only).
 *
 *   npm run list-emails                      # job-related emails, all providers, EMAIL_DAYS_BACK days
 *   npm run list-emails -- --provider icloud # one provider (gmail | icloud, comma-separated)
 *   npm run list-emails -- --days 3 --limit 20
 *   npm run list-emails -- --all             # no keyword filter: every email in the window
 *   npm run list-emails -- --json            # full messages as JSON (includes bodies)
 */
import dotenv from 'dotenv';
import { loadConfig, parseProviderList } from './config/settings';
import { createMailProviders, listEmailsFromAll } from './mail';

dotenv.config();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const config = loadConfig();
  const days = Number(arg('days') ?? config.emailDaysBack);
  const limit = Number(arg('limit') ?? config.emailLimit);
  const providers = createMailProviders(config, parseProviderList(arg('provider')));

  if (providers.length === 0) {
    console.error('No mail provider configured. Set GMAIL_REFRESH_TOKEN and/or ICLOUD_EMAIL + ICLOUD_APP_PASSWORD in .env');
    process.exit(1);
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const messages = await listEmailsFromAll(providers, {
    since,
    limit,
    ...(flag('all') ? { keywords: [] } : {}),
  });

  if (flag('json')) {
    console.log(JSON.stringify(messages, null, 2));
    return;
  }

  console.log(`\n${messages.length} emails since ${since.toISOString().slice(0, 10)}\n`);
  for (const m of messages) {
    const date = m.date.toISOString().slice(0, 16).replace('T', ' ');
    console.log(`${date}  ${m.provider.padEnd(6)}  ${truncate(m.from, 40).padEnd(40)}  ${truncate(m.subject, 80)}`);
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
