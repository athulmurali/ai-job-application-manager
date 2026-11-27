export type MailProviderName = 'gmail' | 'icloud';

/** A provider-neutral email, as returned by every MailProvider. */
export interface MailMessage {
  /** Provider-local id (Gmail message id, or IMAP UID for iCloud). */
  id: string;
  provider: MailProviderName;
  /** The mailbox address this message was read from. */
  account: string;
  /** Folder/label the message was found in, e.g. "INBOX", "Junk", "SPAM". */
  folder?: string;
  /** RFC 5322 Message-ID header, used to de-duplicate across providers. */
  messageId?: string;
  from: string;
  to?: string;
  subject: string;
  /** Plain-text body (HTML is converted to text when there is no text part). */
  body: string;
  date: Date;
}

export interface ListEmailsOptions {
  /** Only messages received on or after this date. */
  since: Date;
  /** Match any of these in subject or body. Empty array = no keyword filter. */
  keywords?: string[];
  /** Maximum number of messages to return (newest first). */
  limit?: number;
  /** Also search spam/junk (Gmail Spam, iCloud Junk). Real invites often land there. Default true. */
  includeSpam?: boolean;
}

/** Adapter interface: one implementation per mail service. */
export interface MailProvider {
  readonly name: MailProviderName;
  listEmails(options: ListEmailsOptions): Promise<MailMessage[]>;
}
