# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gmail-Based Job Tracker Assistant - A tool that scans Gmail inbox for job-related emails and intelligently updates job application tracker on Simplify Jobs. Automates status updates (interview scheduled, feedback received, rejected) by extracting meaning from interview emails and syncing with tracker.

## Technology Stack

- **Node.js v20**
- **TypeScript**
- **Gmail API (OAuth2)** for email access
- **Puppeteer** for Simplify Jobs automation (unless API exists)
- Local CLI/script execution with future CRON job capability

## Architecture

The project follows a modular pipeline architecture:

```
src/
├── gmail/
│   ├── auth.ts              # OAuth2 setup for Gmail API
│   ├── fetchEmails.ts       # Search & pull relevant emails
├── parser/
│   ├── classifyEmail.ts     # Heuristics/NLP to identify intent
│   ├── extractMetadata.ts   # Extract company name, job ID, status type
├── simplify/
│   ├── login.ts             # Puppeteer login (if needed)
│   ├── updateStatus.ts      # Locate & update job status
├── utils/
│   ├── dateUtils.ts         # Parse email times, normalize to local
│   ├── logger.ts            # Logging utility
├── index.ts                 # Main pipeline entry point
```

## Development Commands

```bash
# Install dependencies
yarn install

# Run dry-run mode (safe preview)
yarn dry-run

# Run live mode (actually updates job tracker)
yarn live

# Run live mode safely (last 7 days only)
yarn live-safe

# Development with auto-restart
yarn dev

# Build project
yarn build

# Run compiled version
yarn start

# Type check
yarn typecheck

# Gmail API setup
yarn setup-gmail
```

## Design Principles

- **Modular**: Each component should be reusable and testable
- **Smart Heuristics First**: Rule-based parsing initially (regex on email bodies) before ML/LLM classification
- **Fallback Modes**: If Simplify automation fails, export updates to local `updates.csv` file
- **Explainability**: Log what emails triggered which updates and why

## Key Features

- Email classification for job-related content (interview, application, feedback)
- Intent detection from email content (scheduled, rejected, feedback received)
- Company name and job detail extraction
- Simplify Jobs status synchronization
- Dry-run mode for testing updates before applying
- Sync history tracking (`sync-history.json`)

## Sample Use Cases

- "Interview scheduled with Meta" → mark Meta job as `Interview Scheduled`
- "We're not moving forward" → update Google job to `Rejected`
- "Interview feedback: strong hire" → update Stripe job to `Feedback Received`

## Gmail API Setup

To connect real Gmail data instead of sample emails:

1. **Follow Gmail setup guide:** See `GMAIL_SETUP.md` for detailed instructions
2. **Quick setup:** Run `yarn setup-gmail` and follow prompts
3. **Test connection:** Run `yarn run` - should show real emails instead of samples

## Development Notes

- Start with Gmail email filtering for keywords: "interview", "application", "feedback", "availability"
- Build intent classifier for incoming emails
- Implement dry-run mode first: log what status would change for which company
- Begin with Simplify update stub (mock function)
- Track processed emails to avoid duplicates
- Consider fallback export to CSV/Notion/Google Sheets if Simplify API is limited

## Going Live Checklist

- [ ] Gmail API credentials configured (`yarn setup-gmail`)
- [ ] Test with real emails in dry-run mode
- [ ] Implement Simplify Jobs automation (Puppeteer)
- [ ] Set `DRY_RUN=false` for live updates