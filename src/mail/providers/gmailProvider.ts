import { google, gmail_v1 } from 'googleapis';
import { GmailAuth } from '../../gmail/auth';
import { logger } from '../../utils/logger';
import { JOB_KEYWORDS } from '../keywords';
import { parseRawEmail } from '../parse';
import { ListEmailsOptions, MailMessage, MailProvider } from '../types';

const PAGE_SIZE = 100;
const MAX_RETRIES = 4;

/** Reads Gmail through the Gmail REST API using the OAuth refresh token in .env. */
export class GmailProvider implements MailProvider {
  readonly name = 'gmail' as const;
  private gmail: gmail_v1.Gmail;

  constructor() {
    const auth = new GmailAuth().getAuthenticatedClient();
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async listEmails({
    since,
    keywords = JOB_KEYWORDS,
    limit = 50,
    includeSpam = true,
  }: ListEmailsOptions): Promise<MailMessage[]> {
    const profile = await withRetry(() => this.gmail.users.getProfile({ userId: 'me' }));
    const account = profile.data.emailAddress ?? 'gmail';

    const query = buildQuery(since, keywords, includeSpam);
    logger.info(`[gmail] Searching ${account}${includeSpam ? ' (incl. Spam)' : ''}: ${query}`);

    const ids: string[] = [];
    let pageToken: string | undefined;
    do {
      const res = await withRetry(() =>
        this.gmail.users.messages.list({
          userId: 'me',
          q: query,
          // Gmail search skips Spam and Trash unless this is set; the query then excludes Trash.
          includeSpamTrash: includeSpam,
          maxResults: Math.min(PAGE_SIZE, limit - ids.length),
          pageToken,
        })
      );
      for (const message of res.data.messages ?? []) {
        if (message.id) ids.push(message.id);
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken && ids.length < limit);

    const messages: MailMessage[] = [];
    for (const id of ids) {
      try {
        const res = await withRetry(() => this.gmail.users.messages.get({ userId: 'me', id, format: 'raw' }));
        if (!res.data.raw) continue;
        messages.push(
          await parseRawEmail(Buffer.from(res.data.raw, 'base64url'), {
            id,
            provider: 'gmail',
            account,
            folder: folderFromLabels(res.data.labelIds),
            fallbackDate: res.data.internalDate ? new Date(Number(res.data.internalDate)) : undefined,
          })
        );
      } catch (error) {
        logger.warn(`[gmail] Failed to fetch message ${id}:`, errorSummary(error));
      }
    }

    logger.info(`[gmail] Fetched ${messages.length} messages`);
    return messages;
  }
}

function buildQuery(since: Date, keywords: string[], includeSpam: boolean): string {
  const parts = [`after:${Math.floor(since.getTime() / 1000)}`];
  if (includeSpam) parts.push('-in:trash');
  if (keywords.length > 0) parts.unshift(`(${keywords.map(k => `"${k}"`).join(' OR ')})`);
  return parts.join(' ');
}

function folderFromLabels(labels: string[] | null | undefined): string | undefined {
  if (!labels) return undefined;
  if (labels.includes('SPAM')) return 'SPAM';
  if (labels.includes('INBOX')) return 'INBOX';
  if (labels.includes('SENT')) return 'SENT';
  return 'ARCHIVE';
}

/** Gmail enforces per-user per-minute quotas; back off and retry on rate-limit and transient errors. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status: number | undefined = error?.status ?? error?.response?.status;
      const reason: string | undefined = error?.errors?.[0]?.reason ?? error?.response?.data?.error?.errors?.[0]?.reason;
      const rateLimited = status === 429 || (status === 403 && /rateLimitExceeded|userRateLimitExceeded/.test(reason ?? ''));
      const retryable = rateLimited || (status !== undefined && status >= 500);
      if (!retryable || attempt >= MAX_RETRIES) throw error;

      const delayMs = Math.min(60_000, 2 ** attempt * 2_000) + Math.random() * 1_000;
      logger.warn(`[gmail] ${rateLimited ? 'Rate limited' : `HTTP ${status}`}; retrying in ${Math.round(delayMs / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

function errorSummary(error: any): string {
  return error?.message ?? String(error);
}
