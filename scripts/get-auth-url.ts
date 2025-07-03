#!/usr/bin/env ts-node

import { google } from 'googleapis';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'your_client_id_here';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'your_client_secret_here';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

async function generateAuthUrl() {
  console.log('🔑 Gmail API Authentication Setup\n');

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    prompt: 'consent'
  });

  console.log('📋 STEP 1: Open this URL in your browser:');
  console.log('=' .repeat(80));
  console.log(authUrl);
  console.log('=' .repeat(80));

  console.log('\n📋 STEP 2: After authorizing, copy the "code" parameter from the redirect URL');
  console.log('The URL will look like: http://localhost:3000/oauth2callback?code=AUTHORIZATION_CODE');
  console.log('\n📋 STEP 3: Copy just the AUTHORIZATION_CODE part and run:');
  console.log('yarn get-tokens AUTHORIZATION_CODE');
}

generateAuthUrl();