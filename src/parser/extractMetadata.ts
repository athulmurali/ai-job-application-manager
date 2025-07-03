import { ProcessedEmail, JobApplication } from '../types/JobApplication';
import { logger } from '../utils/logger';

export class MetadataExtractor {
  extractJobTitle(email: ProcessedEmail): string | null {
    const text = `${email.subject} ${email.body}`;
    
    // Common job title patterns
    const patterns = [
      /(?:position|role|job)(?:\s+for|\s+as|\s+:)\s+([A-Z][a-zA-Z\s-]+(?:Engineer|Developer|Manager|Analyst|Scientist|Designer))/i,
      /([A-Z][a-zA-Z\s-]+(?:Engineer|Developer|Manager|Analyst|Scientist|Designer))\s+(?:position|role|job)/i,
      /for\s+the\s+([A-Z][a-zA-Z\s-]+(?:Engineer|Developer|Manager|Analyst|Scientist|Designer))/i,
      /re:\s+([A-Z][a-zA-Z\s-]+(?:Engineer|Developer|Manager|Analyst|Scientist|Designer))/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractInterviewDate(email: ProcessedEmail): string | null {
    const text = email.body;
    
    // Date patterns
    const datePatterns = [
      /(?:on|for)\s+([A-Z][a-z]+,?\s+[A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (error) {
          logger.debug('Failed to parse date:', match[1]);
        }
      }
    }

    return null;
  }

  extractActionItems(email: ProcessedEmail): string[] {
    const text = email.body.toLowerCase();
    const actions: string[] = [];

    // Common action patterns
    const actionPatterns = [
      /please\s+(respond|reply|confirm|let\s+us\s+know)/i,
      /we\s+would\s+like\s+to\s+(schedule|arrange|set\s+up)/i,
      /could\s+you\s+(please\s+)?(provide|send|confirm)/i,
      /please\s+(review|complete|fill\s+out)/i,
      /next\s+step/i,
      /follow\s+up/i
    ];

    for (const pattern of actionPatterns) {
      const match = text.match(pattern);
      if (match) {
        actions.push(match[0]);
      }
    }

    return actions;
  }

  extractJobUrl(email: ProcessedEmail): string | null {
    const text = email.body;
    
    // URL patterns for job postings
    const urlPatterns = [
      /https?:\/\/[^\s]+(?:jobs|careers|apply|greenhouse|lever|workday|ashby)[^\s]*/gi,
      /https?:\/\/[^\s]*\.(?:com|org|net)\/[^\s]*(?:job|career|position)[^\s]*/gi
    ];

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return null;
  }

  extractCompanyDetails(email: ProcessedEmail): { size?: string; industry?: string } {
    const text = email.body.toLowerCase();
    const details: { size?: string; industry?: string } = {};

    // Industry keywords
    const industryKeywords = {
      'technology': ['tech', 'software', 'ai', 'machine learning', 'cloud', 'saas'],
      'finance': ['fintech', 'banking', 'trading', 'cryptocurrency', 'payments'],
      'healthcare': ['health', 'medical', 'biotech', 'pharmaceutical'],
      'ecommerce': ['e-commerce', 'marketplace', 'retail', 'shopping'],
      'media': ['media', 'entertainment', 'streaming', 'social'],
      'automotive': ['automotive', 'transportation', 'mobility', 'vehicle'],
      'gaming': ['gaming', 'game', 'esports', 'entertainment']
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        details.industry = industry;
        break;
      }
    }

    // Company size indicators
    const sizeKeywords = {
      'startup': ['startup', 'early stage', 'seed', 'series a'],
      'medium': ['growing', 'expanding', 'scale-up'],
      'large': ['enterprise', 'fortune 500', 'global', 'multinational']
    };

    for (const [size, keywords] of Object.entries(sizeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        details.size = size;
        break;
      }
    }

    return details;
  }
}