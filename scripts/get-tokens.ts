#!/usr/bin/env ts-node

import { google } from 'googleapis';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'your_client_id_here';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'your_client_secret_here';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

async function getTokens() {
  const authCode = process.argv[2];
  
  if (!authCode) {
    console.error('❌ Please provide the authorization code as an argument:');
    console.error('yarn get-tokens YOUR_AUTHORIZATION_CODE');
    process.exit(1);
  }

  console.log('🔄 Exchanging authorization code for tokens...\n');

  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    
    console.log('✅ SUCCESS! Here are your credentials:\n');
    console.log('Add these to your .env file:');
    console.log('=' .repeat(50));
    console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GMAIL_REDIRECT_URI=${REDIRECT_URI}`);
    console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('=' .repeat(50));
    
    console.log('\n🚀 You can now run the job tracker with real Gmail data!');
    console.log('💡 Set DRY_RUN=false when ready to go live.\n');

  } catch (error) {
    console.error('❌ Error getting access tokens:', error);
    console.error('\n💡 Make sure:');
    console.error('- The authorization code is correct and not expired');
    console.error('- You copied the entire code from the URL');
    console.error('- The code hasn\'t been used already');
  }
}

getTokens();