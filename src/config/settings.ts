export interface AppConfig {
  dryRun: boolean;
  emailDaysBack: number;
  confidenceThreshold: number;
  debug: boolean;
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
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
    debug: process.env.DEBUG?.toLowerCase() === 'true' || process.env.NODE_ENV === 'development',
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

export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  if (!config.gmail.clientId) {
    errors.push('GMAIL_CLIENT_ID is required');
  }

  if (!config.gmail.clientSecret) {
    errors.push('GMAIL_CLIENT_SECRET is required');
  }

  if (!config.gmail.accessToken && !config.gmail.refreshToken) {
    errors.push('Either GMAIL_ACCESS_TOKEN or GMAIL_REFRESH_TOKEN is required');
  }

  if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
    errors.push('CONFIDENCE_THRESHOLD must be between 0 and 1');
  }

  if (config.emailDaysBack < 1 || config.emailDaysBack > 365) {
    errors.push('EMAIL_DAYS_BACK must be between 1 and 365');
  }

  return errors;
}