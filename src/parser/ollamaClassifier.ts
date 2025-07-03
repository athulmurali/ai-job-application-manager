import { ProcessedEmail, EmailClassification, EmailIntent, JobStatus } from '../types/JobApplication';
import { logger } from '../utils/logger';

export class OllamaEmailClassifier {
  private ollamaUrl: string;
  private model: string;

  constructor(ollamaUrl: string = 'http://localhost:11434', model: string = 'llama3.1:8b') {
    this.ollamaUrl = ollamaUrl;
    this.model = model;
  }

  async classifyEmail(email: ProcessedEmail): Promise<EmailClassification> {
    try {
      const prompt = this.buildClassificationPrompt(email);
      const response = await this.callOllama(prompt);
      const classification = this.parseClassificationResponse(response);
      
      logger.debug(`Ollama classified email ${email.id}: ${classification.intent} (${Math.round(classification.confidence * 100)}%)`);
      
      return classification;
    } catch (error) {
      logger.error(`Error classifying email with Ollama: ${error}`);
      return this.getFallbackClassification();
    }
  }

  private buildClassificationPrompt(email: ProcessedEmail): string {
    return `
You are an expert email classifier for job applications. Analyze this email and classify its intent.

Email Details:
- From: ${email.from}
- Subject: ${email.subject}
- Body: ${email.body.substring(0, 1000)}

Classification Options:
1. INTERVIEW_SCHEDULED - Email scheduling an interview or coding challenge
2. REJECTION - Email declining/rejecting the application
3. OFFER - Email with a job offer or offer-related content
4. FEEDBACK_RECEIVED - Email with interview feedback or next steps
5. UNKNOWN - Email not related to job application status

Additional Analysis:
- Extract the company name
- Estimate confidence (0.0 to 1.0)
- If interview/offer, extract any relevant details

Response Format (JSON only):
{
  "intent": "INTERVIEW_SCHEDULED",
  "companyName": "Google",
  "confidence": 0.95,
  "extractedData": {
    "jobTitle": "Senior Software Engineer",
    "interviewDate": "2025-07-10",
    "statusChange": "INTERVIEWING"
  }
}

Respond with only the JSON object, no other text.
`;
  }

  private async callOllama(prompt: string): Promise<string> {
    const requestBody = {
      model: this.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent classification
        num_ctx: 4096    // Context window
      }
    };

    logger.info('🤖 SENDING TO LLAMA:');
    logger.info('=' .repeat(80));
    logger.info(prompt);
    logger.info('=' .repeat(80));

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    
    logger.info('🧠 LLAMA RESPONSE:');
    logger.info('=' .repeat(80));
    logger.info(data.response);
    logger.info('=' .repeat(80));
    
    return data.response;
  }

  private parseClassificationResponse(response: string): EmailClassification {
    try {
      // Extract JSON from response (sometimes models add extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.intent || !parsed.companyName || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid classification format');
      }

      // Map string intent to enum
      const intentMap: { [key: string]: EmailIntent } = {
        'INTERVIEW_SCHEDULED': EmailIntent.INTERVIEW_SCHEDULED,
        'REJECTION': EmailIntent.REJECTION,
        'OFFER': EmailIntent.OFFER,
        'FEEDBACK_RECEIVED': EmailIntent.FEEDBACK_RECEIVED,
        'UNKNOWN': EmailIntent.UNKNOWN
      };

      const intent = intentMap[parsed.intent] || EmailIntent.UNKNOWN;
      
      const result = {
        intent,
        companyName: parsed.companyName,
        confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp to 0-1
        extractedData: parsed.extractedData || {}
      };
      
      logger.info('✅ PARSED CLASSIFICATION:');
      logger.info('=' .repeat(80));
      logger.info(JSON.stringify(result, null, 2));
      logger.info('=' .repeat(80));
      
      return result;
    } catch (error) {
      logger.error(`Error parsing Ollama response: ${error}`);
      logger.debug(`Raw response: ${response}`);
      return this.getFallbackClassification();
    }
  }

  private getFallbackClassification(): EmailClassification {
    return {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0.1,
      extractedData: {}
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json() as { models?: Array<{ name: string }> };
      const hasModel = data.models?.some((model) => model.name.includes(this.model.split(':')[0]));
      
      if (!hasModel) {
        logger.warn(`Model ${this.model} not found. Available models:`, data.models?.map((m) => m.name));
        return false;
      }
      
      logger.info(`✅ Ollama connection successful. Model ${this.model} is available.`);
      return true;
    } catch (error) {
      logger.error(`Failed to connect to Ollama: ${error}`);
      return false;
    }
  }

  async batchClassifyEmails(emails: ProcessedEmail[]): Promise<ProcessedEmail[]> {
    const results = [];
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      logger.info(`Classifying email ${i + 1}/${emails.length} with Ollama...`);
      
      const classification = await this.classifyEmail(email);
      email.classification = classification;
      email.processed = true;
      
      results.push(email);
      
      // Small delay to not overwhelm Ollama
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}