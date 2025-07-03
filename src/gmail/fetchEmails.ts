import { google } from 'googleapis';
import { GmailAuth } from './auth';
import { logger } from '../utils/logger';
import { ProcessedEmail } from '../types/JobApplication';

export class EmailFetcher {
  private gmail: any;
  private auth: GmailAuth;

  constructor() {
    this.auth = new GmailAuth();
  }

  async initialize(): Promise<void> {
    try {
      const authClient = this.auth.getAuthenticatedClient();
      this.gmail = google.gmail({ version: 'v1', auth: authClient });
      logger.info('Gmail API client initialized');
    } catch (error) {
      logger.error('Failed to initialize Gmail API:', error);
      throw error;
    }
  }

  async fetchJobRelatedEmails(daysBack: number = 30): Promise<ProcessedEmail[]> {
    try {
      const query = this.buildSearchQuery(daysBack);
      logger.info(`Searching for emails with query: ${query}`);

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 3  // Limit to 3 emails for demo
      });

      const messages = response.data.messages || [];
      logger.info(`Found ${messages.length} potential job-related emails`);

      const processedEmails: ProcessedEmail[] = [];

      for (const message of messages) {
        try {
          const emailData = await this.fetchEmailDetails(message.id);
          if (emailData) {
            processedEmails.push(emailData);
          }
        } catch (error) {
          logger.warn(`Failed to fetch email ${message.id}:`, error);
        }
      }

      return processedEmails;
    } catch (error) {
      logger.error('Error fetching job-related emails:', error);
      throw error;
    }
  }

  private buildSearchQuery(daysBack: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '/');

    const keywords = [
      'interview',
      'application',
      'feedback',
      'availability',
      'position',
      'job',
      'offer',
      'rejection',
      'thank you for your interest',
      'next steps',
      'coding challenge',
      'technical interview',
      'recruiter',
      'hiring',
      'opportunity'
    ];

    const keywordQuery = keywords.map(keyword => `"${keyword}"`).join(' OR ');
    
    return `(${keywordQuery}) AND after:${formattedDate}`;
  }

  private async fetchEmailDetails(messageId: string): Promise<ProcessedEmail | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload.headers;
      
      const fromHeader = headers.find((h: any) => h.name === 'From');
      const subjectHeader = headers.find((h: any) => h.name === 'Subject');
      const dateHeader = headers.find((h: any) => h.name === 'Date');

      if (!fromHeader || !subjectHeader) {
        return null;
      }

      const body = this.extractEmailBody(message.payload);
      
      return {
        id: messageId,
        from: fromHeader.value,
        subject: subjectHeader.value,
        body,
        date: new Date(dateHeader?.value || message.internalDate),
        classification: {
          intent: 'UNKNOWN' as any,
          companyName: '',
          confidence: 0,
          extractedData: {}
        },
        processed: false
      };
    } catch (error) {
      logger.error(`Error fetching email details for ${messageId}:`, error);
      return null;
    }
  }

  private extractEmailBody(payload: any): string {
    let body = '';

    if (payload.body && payload.body.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body && part.body.data && !body) {
          // Fallback to HTML if no plain text
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return body;
  }
}