#!/usr/bin/env ts-node

/**
 * Gmail API Authentication Setup Script
 * 
 * Run this script to get your Gmail API access tokens:
 * npx ts-node scripts/setup-gmail-auth.ts
 */

import { google } from 'googleapis';
import readline from 'readline';

async function setupGmailAuth() {
  console.log('🔑 Gmail API Authentication Setup\n');

  // Get credentials from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const clientId = await askQuestion(rl, 'Enter your GMAIL_CLIENT_ID: ');
  const clientSecret = await askQuestion(rl, 'Enter your GMAIL_CLIENT_SECRET: ');
  const redirectUri = 'http://localhost:3000/oauth2callback';

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    prompt: 'consent'
  });

  console.log('\n📋 STEP 1: Open this URL in your browser:');
  console.log('=' .repeat(60));
  console.log(authUrl);
  console.log('=' .repeat(60));

  console.log('\n📋 STEP 2: After authorizing, you\'ll be redirected to a URL that looks like:');
  console.log('http://localhost:3000/oauth2callback?code=AUTHORIZATION_CODE&scope=...');
  console.log('\nCopy the AUTHORIZATION_CODE from that URL.\n');

  const authCode = await askQuestion(rl, 'Enter the authorization code: ');

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    
    console.log('\n✅ SUCCESS! Here are your credentials:\n');
    console.log('Add these to your .env file:');
    console.log('=' .repeat(50));
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REDIRECT_URI=${redirectUri}`);
    console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('=' .repeat(50));
    
    console.log('\n🚀 You can now run the job tracker with real Gmail data!');
    console.log('💡 Set DRY_RUN=false when ready to go live.\n');

  } catch (error) {
    console.error('❌ Error getting access tokens:', error);
  }

  rl.close();
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

if (require.main === module) {
  setupGmailAuth().catch(console.error);
}