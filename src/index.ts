import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { loadConfig, validateConfig } from './config/settings';
import { EmailProcessor } from './pipeline/EmailProcessor';
import { SimplifyUpdater } from './simplify/updateStatus';
import { getSampleEmailsForDryRun } from './data/sampleEmails';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logger.info('🚀 Starting Gmail Job Tracker Assistant');
    
    // Load and validate configuration
    const config = loadConfig();
    const configErrors = validateConfig(config);
    
    if (configErrors.length > 0) {
      logger.warn('Configuration issues found (using sample data for demo):');
      configErrors.forEach(error => logger.warn(`  - ${error}`));
    }

    logger.info(`Running in ${config.dryRun ? 'DRY-RUN' : 'LIVE'} mode`);
    logger.info(`Email processing: ${config.emailDaysBack} days back, ${config.confidenceThreshold} confidence threshold`);

    // Initialize components
    const emailProcessor = new EmailProcessor(config);
    const simplifyUpdater = new SimplifyUpdater(config.dryRun);

    // Fetch emails from Gmail if credentials are configured, otherwise use samples
    let emails;
    
    if (config.gmail.accessToken || config.gmail.refreshToken) {
      try {
        logger.info('📧 Fetching emails from Gmail API...');
        const { EmailFetcher } = await import('./gmail/fetchEmails');
        const emailFetcher = new EmailFetcher();
        await emailFetcher.initialize();
        emails = await emailFetcher.fetchJobRelatedEmails(config.emailDaysBack);
        logger.info(`Found ${emails.length} job-related emails from Gmail`);
      } catch (error) {
        logger.error('Failed to fetch emails from Gmail, falling back to sample data:', error);
        emails = getSampleEmailsForDryRun();
      }
    } else {
      logger.info('📧 No Gmail credentials found, using sample emails for demonstration...');
      emails = getSampleEmailsForDryRun();
    }
    
    if (emails.length === 0) {
      logger.info('No emails found to process');
      return;
    }

    // Process emails and classify them
    logger.info('🔍 Processing and classifying emails...');
    const statusUpdates = await emailProcessor.processEmails(emails, config.confidenceThreshold);

    // Show processing summary
    const summary = emailProcessor.getProcessingSummary(emails);
    logger.info('📊 Email Processing Summary:');
    logger.info(`  - Total emails: ${summary.total}`);
    logger.info(`  - Processed: ${summary.processed}`);
    logger.info(`  - Average confidence: ${Math.round(summary.avgConfidence * 100)}%`);
    logger.info(`  - By intent: ${JSON.stringify(summary.byIntent, null, 2)}`);
    logger.info(`  - By company: ${JSON.stringify(summary.byCompany, null, 2)}`);

    if (statusUpdates.length === 0) {
      logger.info('No status updates generated (confidence threshold not met or no actionable emails)');
      return;
    }

    // Generate and display dry-run results
    logger.info(`\n${'='.repeat(60)}`);
    logger.info('📋 STATUS UPDATE PREVIEW (DRY-RUN MODE)');
    logger.info(`${'='.repeat(60)}`);

    await simplifyUpdater.batchUpdateStatuses(statusUpdates);

    // Generate summary
    const updateSummary = simplifyUpdater.generateUpdateSummary(statusUpdates);
    logger.info(`\n${updateSummary}`);

    // Export to CSV option
    if (statusUpdates.length > 0) {
      logger.info('\n💾 Exporting updates to CSV format...');
      await simplifyUpdater.exportToCSV(statusUpdates, `job_updates_${new Date().toISOString().split('T')[0]}.csv`);
    }

    logger.info('\n✅ Pipeline completed successfully');
    
    if (config.dryRun) {
      logger.info('\n🔧 To run in live mode, set DRY_RUN=false in your .env file');
      logger.info('📝 To use real Gmail data, configure Gmail API credentials in .env file');
    }

  } catch (error) {
    logger.error('💥 Error in main pipeline:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}