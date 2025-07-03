# 🔑 Gmail API Setup Guide

Follow these steps to get your Gmail API credentials and connect your real Gmail account.

## Step 1: Google Cloud Console (10 minutes)

### 1.1 Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `job-tracker-gmail-api`
4. Click "Create"

### 1.2 Enable Gmail API

1. Go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on Gmail API → Click "Enable"

## Step 2: OAuth2 Credentials (10 minutes)

### 2.1 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for personal use)
3. Fill required fields:
   - **App name:** Job Tracker Gmail API
   - **User support email:** your email
   - **Developer contact:** your email
4. Click "Save and Continue" through all steps
5. Add yourself as a test user in "Test users"

### 2.2 Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Desktop application"
4. Name: "Job Tracker Desktop Client"
5. Click "Create"
6. **Copy the Client ID and Client Secret** - you'll need these!

## Step 3: Get Access Tokens (10 minutes)

### 3.1 Run the Setup Script

```bash
yarn setup-gmail
```

### 3.2 Follow the Interactive Prompts

1. Enter your `CLIENT_ID` and `CLIENT_SECRET`
2. Open the provided authorization URL in your browser
3. Grant permissions to your Gmail account
4. Copy the authorization code from the redirect URL
5. Paste it into the terminal

### 3.3 Update Your .env File

The script will output credentials like this:

```bash
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/oauth2callback
GMAIL_ACCESS_TOKEN=your_access_token_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

Copy these into your `.env` file.

## Step 4: Test the Connection

```bash
# Test with real Gmail data
yarn run
```

You should see:

- ✅ No configuration warnings
- ✅ "Fetching emails from Gmail API..." instead of sample data
- ✅ Real emails from your inbox being processed

## Step 5: Ready for Live Mode

Once Gmail is connected:

```bash
# Edit .env file
DRY_RUN=false

# Run in live mode (will actually update job tracker)
yarn run
```

## 🔒 Security Notes

- Keep your `.env` file secure and never commit it to git
- The refresh token allows the app to access Gmail without re-authorization
- You can revoke access anytime in [Google Account permissions](https://myaccount.google.com/permissions)

## 🐛 Troubleshooting

### "Invalid client" error

- Double-check CLIENT_ID and CLIENT_SECRET are correct
- Ensure OAuth consent screen is configured

### "Access blocked" error  

- Add yourself as a test user in OAuth consent screen
- Make sure Gmail API is enabled

### "Invalid grant" error

- The authorization code might be expired (valid for ~10 minutes)
- Run the setup script again for a fresh code

## 📧 Gmail Permissions Requested

The app requests these Gmail permissions:

- **Read emails:** To scan for job-related messages
- **Modify emails:** To mark emails as processed (optional feature)

**No emails are deleted or sent - only read and optionally labeled!**
