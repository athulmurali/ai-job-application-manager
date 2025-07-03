import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';

export class GmailAuth {
  private oauth2Client: OAuth2Client;

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

    if (!clientId || !clientSecret) {
      throw new Error('Gmail OAuth credentials not found in environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getAccessToken(code: string): Promise<string> {
    try {
      const tokenResponse = await this.oauth2Client.getToken(code);
      const tokens = tokenResponse.tokens;
      
      if (tokens.access_token) {
        this.oauth2Client.setCredentials(tokens);
        logger.info('Successfully obtained access token');
        
        // Save refresh token if available
        if (tokens.refresh_token) {
          logger.info('Refresh token obtained for future use');
          // TODO: Save refresh token securely
        }
        
        return tokens.access_token;
      }
      
      throw new Error('No access token received');
    } catch (error) {
      logger.error('Error getting access token:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error('Refresh token not found in environment variables');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        logger.info('Successfully refreshed access token');
        return credentials.access_token;
      }
      
      throw new Error('No access token received from refresh');
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  getAuthenticatedClient(): OAuth2Client {
    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!accessToken && !refreshToken) {
      throw new Error('No Gmail credentials found. Please authenticate first.');
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    return this.oauth2Client;
  }
}