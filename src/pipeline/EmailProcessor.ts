import { EmailClassifier } from '../parser/classifyEmail';
import { OllamaEmailClassifier } from '../parser/ollamaClassifier';
import { MetadataExtractor } from '../parser/extractMetadata';
import { ProcessedEmail, EmailIntent, JobStatus } from '../types/JobApplication';
import { StatusUpdate } from '../simplify/updateStatus';
import { logger } from '../utils/logger';
import { AppConfig } from '../config/settings';

export class EmailProcessor {
  private classifier: EmailClassifier;
  private ollamaClassifier?: OllamaEmailClassifier;
  private extractor: MetadataExtractor;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.classifier = new EmailClassifier();
    this.extractor = new MetadataExtractor();
    
    if (config.ollama.enabled) {
      this.ollamaClassifier = new OllamaEmailClassifier(config.ollama.url, config.ollama.model);
    }
  }

  async processEmails(emails: ProcessedEmail[], confidenceThreshold: number = 0.7): Promise<StatusUpdate[]> {
    logger.info(`Processing ${emails.length} emails for job status updates`);
    
    // Test Ollama connection if enabled
    if (this.config.ollama.enabled && this.ollamaClassifier) {
      const isConnected = await this.ollamaClassifier.testConnection();
      if (!isConnected) {
        logger.warn('Ollama not available, falling back to basic classifier');
        this.ollamaClassifier = undefined;
      }
    }
    
    const statusUpdates: StatusUpdate[] = [];

    for (const email of emails) {
      try {
        let classification;
        
        if (this.ollamaClassifier) {
          // Use Ollama for superior classification
          classification = await this.ollamaClassifier.classifyEmail(email);
          logger.debug(`Ollama classified email from ${email.from}: ${classification.intent} (${Math.round(classification.confidence * 100)}%)`);
        } else {
          // Fallback to basic classifier
          classification = this.classifier.classifyEmail(email);
          logger.debug(`Basic classifier: ${classification.intent} (${Math.round(classification.confidence * 100)}%)`);
        }
        
        email.classification = classification;

        logger.debug(`Email from ${email.from} classified as ${classification.intent} with ${Math.round(classification.confidence * 100)}% confidence`);

        // Only process emails that meet confidence threshold and have actionable intents
        if (classification.confidence >= confidenceThreshold && this.isActionableIntent(classification.intent)) {
          const statusUpdate = this.generateStatusUpdate(email, classification);
          if (statusUpdate) {
            statusUpdates.push(statusUpdate);
          }
        } else {
          logger.debug(`Skipping email ${email.id}: confidence ${classification.confidence} below threshold ${confidenceThreshold} or non-actionable intent ${classification.intent}`);
        }

        email.processed = true;
      } catch (error) {
        logger.error(`Error processing email ${email.id}:`, error);
      }
    }

    logger.info(`Generated ${statusUpdates.length} status updates from ${emails.length} emails`);
    return statusUpdates;
  }

  private isActionableIntent(intent: EmailIntent): boolean {
    const actionableIntents = [
      EmailIntent.INTERVIEW_SCHEDULED,
      EmailIntent.REJECTION,
      EmailIntent.OFFER,
      EmailIntent.FEEDBACK_RECEIVED
    ];
    
    return actionableIntents.includes(intent);
  }

  private generateStatusUpdate(email: ProcessedEmail, classification: any): StatusUpdate | null {
    if (!classification.companyName) {
      logger.warn(`No company name extracted from email ${email.id}, skipping status update`);
      return null;
    }

    const jobTitle = this.extractor.extractJobTitle(email);
    const newStatus = this.mapIntentToStatus(classification.intent);
    
    if (!newStatus) {
      logger.warn(`Could not map intent ${classification.intent} to job status`);
      return null;
    }

    return {
      companyName: classification.companyName,
      jobTitle: jobTitle || undefined,
      oldStatus: JobStatus.APPLIED, // We'll need to look this up from existing data
      newStatus,
      reason: this.generateUpdateReason(classification.intent, email.subject),
      confidence: classification.confidence,
      emailId: email.id
    };
  }

  private mapIntentToStatus(intent: EmailIntent): JobStatus | null {
    const intentToStatusMap: { [key in EmailIntent]?: JobStatus } = {
      [EmailIntent.INTERVIEW_SCHEDULED]: JobStatus.INTERVIEWING,
      [EmailIntent.REJECTION]: JobStatus.REJECTED,
      [EmailIntent.OFFER]: JobStatus.OFFERED,
      [EmailIntent.FEEDBACK_RECEIVED]: JobStatus.INTERVIEWING, // Assume still in process
    };

    return intentToStatusMap[intent] || null;
  }

  private generateUpdateReason(intent: EmailIntent, subject: string): string {
    const reasonMap: { [key in EmailIntent]?: string } = {
      [EmailIntent.INTERVIEW_SCHEDULED]: `Interview scheduled - detected from email: "${subject}"`,
      [EmailIntent.REJECTION]: `Application rejected - detected from email: "${subject}"`,
      [EmailIntent.OFFER]: `Job offer received - detected from email: "${subject}"`,
      [EmailIntent.FEEDBACK_RECEIVED]: `Interview feedback received - detected from email: "${subject}"`,
    };

    return reasonMap[intent] || `Status update based on email: "${subject}"`;
  }

  getProcessingSummary(emails: ProcessedEmail[]): {
    total: number;
    processed: number;
    byIntent: { [key: string]: number };
    byCompany: { [key: string]: number };
    avgConfidence: number;
  } {
    const summary = {
      total: emails.length,
      processed: emails.filter(e => e.processed).length,
      byIntent: {} as { [key: string]: number },
      byCompany: {} as { [key: string]: number },
      avgConfidence: 0
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    emails.forEach(email => {
      if (email.classification) {
        const intent = email.classification.intent;
        const company = email.classification.companyName;
        
        summary.byIntent[intent] = (summary.byIntent[intent] || 0) + 1;
        
        if (company) {
          summary.byCompany[company] = (summary.byCompany[company] || 0) + 1;
        }
        
        totalConfidence += email.classification.confidence;
        confidenceCount++;
      }
    });

    summary.avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return summary;
  }
}