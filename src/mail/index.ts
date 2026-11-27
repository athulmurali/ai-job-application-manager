import { AppConfig } from '../config/settings';
import { EmailIntent, ProcessedEmail } from '../types/JobApplication';
import { logger } from '../utils/logger';
import { GmailProvider } from './providers/gmailProvider';
import { ICloudProvider } from './providers/icloudProvider';
import { ListEmailsOptions, MailMessage, MailProvider, MailProviderName } from './types';

export * from './types';
export { JOB_KEYWORDS } from './keywords';

/** Which providers have credentials configured. */
export function configuredProviders(config: AppConfig): MailProviderName[] {
  const names: MailProviderName[] = [];
  if (config.gmail.accessToken || config.gmail.refreshToken) names.push('gmail');
  if (config.icloud.email && config.icloud.appPassword) names.push('icloud');
  return names;
}

/**
 * Build the providers to read from: those named in MAIL_PROVIDERS (comma-separated),
 * or every provider with credentials configured when it is unset.
 */
export function createMailProviders(config: AppConfig, only?: MailProviderName[]): MailProvider[] {
  const available = configuredProviders(config);
  const wanted = only ?? config.mailProviders ?? available;

  return wanted.flatMap((name): MailProvider[] => {
    if (!available.includes(name)) {
      logger.warn(`Mail provider "${name}" requested but its credentials are not configured; skipping`);
      return [];
    }
    switch (name) {
      case 'gmail':
        return [new GmailProvider()];
      case 'icloud':
        return [
          new ICloudProvider({
            email: config.icloud.email!,
            appPassword: config.icloud.appPassword!,
            mailbox: config.icloud.mailbox,
          }),
        ];
    }
  });
}

/**
 * Fetch from every provider in parallel, merge, de-duplicate (same Message-ID in two inboxes),
 * and sort newest first. One provider failing doesn't stop the others; throws only if all fail.
 */
export async function listEmailsFromAll(providers: MailProvider[], options: ListEmailsOptions): Promise<MailMessage[]> {
  const results = await Promise.allSettled(providers.map(p => p.listEmails(options)));

  const merged: MailMessage[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
    } else {
      logger.error(`[${providers[i].name}] Failed to list emails:`, result.reason);
    }
  });

  if (providers.length > 0 && results.every(r => r.status === 'rejected')) {
    throw new Error('All mail providers failed');
  }

  const seen = new Set<string>();
  const unique = merged.filter(m => {
    if (!m.messageId) return true;
    if (seen.has(m.messageId)) return false;
    seen.add(m.messageId);
    return true;
  });

  return unique.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Adapt a MailMessage to the pipeline's ProcessedEmail shape. */
export function toProcessedEmail(message: MailMessage): ProcessedEmail {
  return {
    id: `${message.provider}:${message.id}`,
    source: `${message.provider}:${message.account}`,
    from: message.from,
    subject: message.subject,
    body: message.body,
    date: message.date,
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {},
    },
    processed: false,
  };
}
