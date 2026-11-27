import { ImapFlow, SearchObject } from 'imapflow';
import { logger } from '../../utils/logger';
import { JOB_KEYWORDS, matchesKeywords } from '../keywords';
import { parseRawEmail } from '../parse';
import { ListEmailsOptions, MailMessage, MailProvider } from '../types';

export interface ICloudConfig {
  /** Primary iCloud address (also used for Hide My Email / custom-domain mail). */
  email: string;
  /** App-specific password from account.apple.com → Sign-In and Security. */
  appPassword: string;
  mailbox?: string;
}

/**
 * Reads iCloud Mail over IMAP (Apple has no REST mail API).
 * Mailboxes are opened read-only, so messages are never marked as read or changed.
 */
export class ICloudProvider implements MailProvider {
  readonly name = 'icloud' as const;

  constructor(private readonly config: ICloudConfig) {}

  async listEmails({
    since,
    keywords = JOB_KEYWORDS,
    limit = 50,
    includeSpam = true,
  }: ListEmailsOptions): Promise<MailMessage[]> {
    const client = new ImapFlow({
      host: 'imap.mail.me.com',
      port: 993,
      secure: true,
      auth: { user: this.config.email, pass: this.config.appPassword },
      logger: false,
    });

    try {
      await client.connect();
    } catch (error: any) {
      if (error?.authenticationFailed) {
        throw new Error(
          'iCloud login failed: ICLOUD_APP_PASSWORD must be an app-specific password (not your Apple Account password), ' +
            'and ICLOUD_EMAIL must be your primary iCloud address.'
        );
      }
      throw error;
    }

    try {
      const mailboxes = [this.config.mailbox ?? 'INBOX'];
      if (includeSpam) {
        const junk = (await client.list()).find(box => box.specialUse === '\\Junk');
        if (junk && !mailboxes.includes(junk.path)) mailboxes.push(junk.path);
      }

      const messages: MailMessage[] = [];
      for (const mailbox of mailboxes) {
        messages.push(...(await this.listMailbox(client, mailbox, since, keywords, limit)));
      }

      messages.sort((a, b) => b.date.getTime() - a.date.getTime());
      const result = messages.slice(0, limit);
      logger.info(`[icloud] Fetched ${result.length} messages from ${mailboxes.join(', ')}`);
      return result;
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  private async listMailbox(
    client: ImapFlow,
    mailbox: string,
    since: Date,
    keywords: string[],
    limit: number
  ): Promise<MailMessage[]> {
    const lock = await client.getMailboxLock(mailbox, { readOnly: true });
    try {
      logger.info(`[icloud] Searching ${this.config.email}/${mailbox} since ${since.toISOString().slice(0, 10)}`);

      // Try a server-side keyword search; if the server rejects it, search by date and filter locally.
      let filterLocally = false;
      let uids: number[] = [];
      try {
        const query: SearchObject = { since };
        if (keywords.length > 0) {
          query.or = keywords.flatMap(k => [{ subject: k }, { body: k }]);
        }
        uids = (await client.search(query, { uid: true })) || [];
      } catch (error) {
        logger.warn(`[icloud] Server-side keyword search failed in ${mailbox}, filtering locally instead:`, error);
        filterLocally = keywords.length > 0;
        uids = (await client.search({ since }, { uid: true })) || [];
      }

      // Newest first. When filtering locally, fetch everything since `since` and trim after matching.
      uids.sort((a, b) => b - a);
      const toFetch = filterLocally ? uids : uids.slice(0, limit);
      if (toFetch.length === 0) return [];

      const messages: MailMessage[] = [];
      for await (const msg of client.fetch(toFetch, { uid: true, source: true, internalDate: true }, { uid: true })) {
        if (!msg.source) continue;
        const parsed = await parseRawEmail(msg.source, {
          // UIDs are only unique within a mailbox.
          id: `${mailbox}/${msg.uid}`,
          provider: 'icloud',
          account: this.config.email,
          folder: mailbox,
          fallbackDate: msg.internalDate ? new Date(msg.internalDate) : undefined,
        });
        if (!filterLocally || matchesKeywords(`${parsed.subject}\n${parsed.body}`, keywords)) {
          messages.push(parsed);
        }
      }
      return messages;
    } finally {
      lock.release();
    }
  }
}
