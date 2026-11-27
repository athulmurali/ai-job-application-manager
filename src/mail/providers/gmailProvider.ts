import { google, gmail_v1 } from 'googleapis';
import { GmailAuth } from '../../gmail/auth';
import { logger } from '../../utils/logger';
import { JOB_KEYWORDS } from '../keywords';
import { parseRawEmail } from '../parse';
import { ListEmailsOptions, MailMessage, MailProvider } from '../types';

const PAGE_SIZE = 100;

/** Reads Gmail through the Gmail REST API using the OAuth refresh token in .env. */
export class GmailProvider implements MailProvider {
  readonly name = 'gmail' as const;
  private gmail: gmail_v1.Gmail;

  constructor() {
    const auth = new GmailAuth().getAuthenticatedClient();
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async listEmails({ since, keywords = JOB_KEYWORDS, limit = 50 }: ListEmailsOptions): Promise<MailMessage[]> {
    const profile = await this.gmail.users.getProfile({ userId: 'me' });
    const account = profile.data.emailAddress ?? 'gmail';

    const query = buildQuery(since, keywords);
    logger.info(`[gmail] Searching ${account}: ${query}`);

    const ids: string[] = [];
    let pageToken: string | undefined;
    do {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.min(PAGE_SIZE, limit - ids.length),
        pageToken,
      });
      for (const message of res.data.messages ?? []) {
        if (message.id) ids.push(message.id);
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken && ids.length < limit);

    const messages: MailMessage[] = [];
    for (const id of ids) {
      try {
        const res = await this.gmail.users.messages.get({ userId: 'me', id, format: 'raw' });
        if (!res.data.raw) continue;
        messages.push(
          await parseRawEmail(Buffer.from(res.data.raw, 'base64url'), {
            id,
            provider: 'gmail',
            account,
            fallbackDate: res.data.internalDate ? new Date(Number(res.data.internalDate)) : undefined,
          })
        );
      } catch (error) {
        logger.warn(`[gmail] Failed to fetch message ${id}:`, error);
      }
    }

    logger.info(`[gmail] Fetched ${messages.length} messages`);
    return messages;
  }
}

function buildQuery(since: Date, keywords: string[]): string {
  const after = `after:${Math.floor(since.getTime() / 1000)}`;
  if (keywords.length === 0) return after;
  return `(${keywords.map(k => `"${k}"`).join(' OR ')}) ${after}`;
}
