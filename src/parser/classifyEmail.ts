import { ProcessedEmail, EmailClassification, EmailIntent, JobStatus } from '../types/JobApplication';
import { logger } from '../utils/logger';

export class EmailClassifier {
  private interviewKeywords = [
    'interview', 'scheduled', 'calendar', 'meeting', 'zoom', 'teams',
    'available', 'availability', 'time slot', 'phone screen', 'video call'
  ];

  private rejectionKeywords = [
    'not moving forward', 'not selected', 'rejected', 'unfortunately',
    'different direction', 'other candidates', 'decline', 'regret to inform',
    'not a fit', 'decided not to proceed', 'thank you for your interest'
  ];

  private offerKeywords = [
    'offer', 'congratulations', 'pleased to offer', 'extend an offer',
    'compensation package', 'start date', 'salary', 'benefits'
  ];

  private feedbackKeywords = [
    'feedback', 'next steps', 'following up', 'update on your application',
    'interview feedback', 'next round', 'additional interview'
  ];

  private companyPatterns = [
    /from.*@([a-zA-Z0-9-]+)\./i,
    /([A-Z][a-zA-Z\s&.,-]+)(?:\s+team|\s+recruiting|\s+careers|\s+hr)/i,
    /interview\s+with\s+([A-Z][a-zA-Z\s&.,-]+)/i
  ];

  classifyEmail(email: ProcessedEmail): EmailClassification {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    const fromDomain = this.extractDomain(email.from);
    
    let intent = this.determineIntent(text);
    let companyName = this.extractCompanyName(email.from, email.subject, email.body);
    let confidence = this.calculateConfidence(text, intent);

    const extractedData = this.extractAdditionalData(email, intent);

    return {
      intent,
      companyName,
      confidence,
      extractedData
    };
  }

  private determineIntent(text: string): EmailIntent {
    const lowerText = text.toLowerCase();

    // Check for rejection first (often most explicit)
    if (this.containsKeywords(lowerText, this.rejectionKeywords)) {
      return EmailIntent.REJECTION;
    }

    // Check for offer
    if (this.containsKeywords(lowerText, this.offerKeywords)) {
      return EmailIntent.OFFER;
    }

    // Check for interview scheduling
    if (this.containsKeywords(lowerText, this.interviewKeywords)) {
      return EmailIntent.INTERVIEW_SCHEDULED;
    }

    // Check for general feedback
    if (this.containsKeywords(lowerText, this.feedbackKeywords)) {
      return EmailIntent.FEEDBACK_RECEIVED;
    }

    return EmailIntent.UNKNOWN;
  }

  private extractCompanyName(from: string, subject: string, body: string): string {
    // Try to extract from email address first
    const domain = this.extractDomain(from);
    const domainCompany = this.domainToCompanyName(domain);
    
    if (domainCompany) {
      return domainCompany;
    }

    // Try to extract from subject and body using patterns
    const text = `${subject} ${body}`;
    
    for (const pattern of this.companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanCompanyName(match[1]);
      }
    }

    // Fallback to domain if no pattern matches
    return this.cleanCompanyName(domain);
  }

  private extractDomain(email: string): string {
    const match = email.match(/@([^>]+)/);
    return match ? match[1].toLowerCase() : '';
  }

  private domainToCompanyName(domain: string): string | null {
    const knownDomains: { [key: string]: string } = {
      'google.com': 'Google',
      'microsoft.com': 'Microsoft',
      'amazon.com': 'Amazon',
      'facebook.com': 'Meta',
      'meta.com': 'Meta',
      'netflix.com': 'Netflix',
      'uber.com': 'Uber',
      'airbnb.com': 'Airbnb',
      'stripe.com': 'Stripe',
      'github.com': 'GitHub',
      'gitlab.com': 'GitLab',
      'spotify.com': 'Spotify',
      'twitter.com': 'X (Twitter)',
      'linkedin.com': 'LinkedIn',
      'salesforce.com': 'Salesforce',
      'oracle.com': 'Oracle',
      'adobe.com': 'Adobe',
      'tesla.com': 'Tesla',
      'apple.com': 'Apple',
      'databricks.com': 'Databricks',
      'snowflake.com': 'Snowflake',
      'robinhood.com': 'Robinhood',
      'coinbase.com': 'Coinbase',
      'palantir.com': 'Palantir',
      'figma.com': 'Figma',
      'notion.so': 'Notion',
      'discord.com': 'Discord',
      'roblox.com': 'Roblox'
    };

    return knownDomains[domain] || null;
  }

  private cleanCompanyName(name: string): string {
    return name
      .replace(/\b(team|recruiting|careers|hr|inc|llc|corp|ltd)\b/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private calculateConfidence(text: string, intent: EmailIntent): number {
    if (intent === EmailIntent.UNKNOWN) {
      return 0.1;
    }

    let confidence = 0.5; // Base confidence

    // Increase confidence based on keyword matches
    const keywordSets: { [key in EmailIntent]?: string[] } = {
      [EmailIntent.INTERVIEW_SCHEDULED]: this.interviewKeywords,
      [EmailIntent.REJECTION]: this.rejectionKeywords,
      [EmailIntent.OFFER]: this.offerKeywords,
      [EmailIntent.FEEDBACK_RECEIVED]: this.feedbackKeywords
    };

    const relevantKeywords = keywordSets[intent] || [];
    const matches = relevantKeywords.filter((keyword: string) => text.includes(keyword));
    
    confidence += (matches.length / relevantKeywords.length) * 0.4;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private extractAdditionalData(email: ProcessedEmail, intent: EmailIntent): any {
    const data: any = {};

    if (intent === EmailIntent.INTERVIEW_SCHEDULED) {
      data.statusChange = JobStatus.INTERVIEWING;
      // TODO: Extract interview date/time
    } else if (intent === EmailIntent.REJECTION) {
      data.statusChange = JobStatus.REJECTED;
    } else if (intent === EmailIntent.OFFER) {
      data.statusChange = JobStatus.OFFERED;
    }

    return data;
  }
}