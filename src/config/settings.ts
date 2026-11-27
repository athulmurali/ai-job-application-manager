import type { MailProviderName } from '../mail/types';

const MAIL_PROVIDER_NAMES: MailProviderName[] = ['gmail', 'icloud'];

export interface AppConfig {
  dryRun: boolean;
  emailDaysBack: number;
  /** Max emails fetched per provider per run. */
  emailLimit: number;
  confidenceThreshold: number;
  debug: boolean;
  /** Providers to read from (MAIL_PROVIDERS=gmail,icloud). Undefined = every configured provider. */
  mailProviders?: MailProviderName[];
  icloud: {
    email?: string;
    appPassword?: string;
    mailbox?: string;
  };
  gmail: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  simplify: {
    username?: string;
    password?: string;
  };
  ollama: {
    enabled: boolean;
    url: string;
    model: string;
  };
}

export function loadConfig(): AppConfig {
  return {
    dryRun: process.env.DRY_RUN?.toLowerCase() === 'true' || true, // Default to true for safety
    emailDaysBack: parseInt(process.env.EMAIL_DAYS_BACK || '30'),
    emailLimit: parseInt(process.env.EMAIL_LIMIT || '50'),
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
    debug: process.env.DEBUG?.toLowerCase() === 'true' || process.env.NODE_ENV === 'development',
    mailProviders: parseProviderList(process.env.MAIL_PROVIDERS),
    icloud: {
      email: process.env.ICLOUD_EMAIL,
      appPassword: process.env.ICLOUD_APP_PASSWORD,
      mailbox: process.env.ICLOUD_MAILBOX || 'INBOX',
    },
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      redirectUri: process.env.GMAIL_REDIRECT_URI,
      accessToken: process.env.GMAIL_ACCESS_TOKEN,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
    simplify: {
      username: process.env.SIMPLIFY_USERNAME,
      password: process.env.SIMPLIFY_PASSWORD,
    },
    ollama: {
      enabled: process.env.USE_OLLAMA?.toLowerCase() === 'true' || false,
      url: process.env.OLLAMA_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    }
  };
}

export function parseProviderList(value: string | undefined): MailProviderName[] | undefined {
  if (!value?.trim()) return undefined;
  const names = value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const unknown = names.filter(n => !MAIL_PROVIDER_NAMES.includes(n as MailProviderName));
  if (unknown.length > 0) {
    throw new Error(`Unknown mail provider(s): ${unknown.join(', ')}. Valid: ${MAIL_PROVIDER_NAMES.join(', ')}`);
  }
  return names as MailProviderName[];
}

export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  const hasGmailToken = Boolean(config.gmail.accessToken || config.gmail.refreshToken);
  const hasICloud = Boolean(config.icloud.email && config.icloud.appPassword);

  if (!hasGmailToken && !hasICloud) {
    errors.push(
      'No mail provider configured: set GMAIL_REFRESH_TOKEN (Gmail) and/or ICLOUD_EMAIL + ICLOUD_APP_PASSWORD (iCloud)'
    );
  }

  if (hasGmailToken && (!config.gmail.clientId || !config.gmail.clientSecret)) {
    errors.push('GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are required to use Gmail');
  }

  if (Boolean(config.icloud.email) !== Boolean(config.icloud.appPassword)) {
    errors.push('ICLOUD_EMAIL and ICLOUD_APP_PASSWORD must both be set to use iCloud');
  }

  if (config.emailLimit < 1) {
    errors.push('EMAIL_LIMIT must be at least 1');
  }

  if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
    errors.push('CONFIDENCE_THRESHOLD must be between 0 and 1');
  }

  if (config.emailDaysBack < 1 || config.emailDaysBack > 365) {
    errors.push('EMAIL_DAYS_BACK must be between 1 and 365');
  }

  return errors;
}