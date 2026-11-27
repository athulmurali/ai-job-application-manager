import { simpleParser } from 'mailparser';
import { MailMessage, MailProviderName } from './types';

interface ParseMeta {
  id: string;
  provider: MailProviderName;
  account: string;
  /** Used when the message has no parsable Date header. */
  fallbackDate?: Date;
}

/** Parse a raw RFC 822 message into a MailMessage. Both providers fetch raw MIME, so parsing is identical. */
export async function parseRawEmail(raw: Buffer, meta: ParseMeta): Promise<MailMessage> {
  const parsed = await simpleParser(raw);

  const html = typeof parsed.html === 'string' ? parsed.html : '';
  const body = parsed.text?.trim() || stripHtml(html);
  const to = Array.isArray(parsed.to) ? parsed.to.map(a => a.text).join(', ') : parsed.to?.text;

  return {
    id: meta.id,
    provider: meta.provider,
    account: meta.account,
    messageId: parsed.messageId,
    from: parsed.from?.text ?? '',
    to,
    subject: parsed.subject ?? '',
    body,
    date: parsed.date ?? meta.fallbackDate ?? new Date(0),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
