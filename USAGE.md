# 🚀 Job Tracker Usage Guide

Quick reference for running your Gmail-powered job tracker with Ollama AI.

## 📋 Quick Commands

### 🔍 **Dry-Run Mode (Safe Preview)**
```bash
yarn dry-run
```
- Shows what would be updated without making changes
- Displays AI classification with confidence scores
- Safe to run anytime

### ⚡ **Live Mode (Real Updates)**
```bash
yarn live
```
- Actually updates your job tracker
- Uses all emails from configured time period
- **⚠️ Use with caution - makes real changes**

### 🛡️ **Live Mode (Safe)**
```bash
yarn live-safe
```
- Live updates but only last 7 days
- Good for testing live mode
- Limited scope reduces risk

## 📊 **What Each Mode Does**

| Command | Updates Data | Email Scope | Safety |
|---------|--------------|-------------|--------|
| `yarn dry-run` | ❌ No | All configured | ✅ Completely safe |
| `yarn live-safe` | ✅ Yes | Last 7 days | 🔶 Limited risk |
| `yarn live` | ✅ Yes | All configured | ⚠️ Full scope |

## 🔧 **Configuration**

Edit `.env` file to control behavior:

```bash
# Mode control
DRY_RUN=true                    # Set to false for live mode

# Email processing
EMAIL_DAYS_BACK=30             # How many days to look back
CONFIDENCE_THRESHOLD=0.8       # Minimum AI confidence (0.0-1.0)

# AI classification
USE_OLLAMA=true                # Use local Ollama AI
OLLAMA_MODEL=llama3.1:8b       # AI model to use
```

## 📈 **Typical Workflow**

### 1. **Initial Setup**
```bash
# Set up Gmail API
yarn setup-gmail

# Test with dry-run
yarn dry-run
```

### 2. **Going Live**
```bash
# Test with limited scope
yarn live-safe

# Full live mode when confident
yarn live
```

### 3. **Regular Use**
```bash
# Daily/weekly check
yarn dry-run

# Apply updates when satisfied
yarn live-safe
```

## 📝 **Output Examples**

### Dry-Run Output:
```
📋 STATUS UPDATE PREVIEW (DRY-RUN MODE)
DRY RUN - Would update job status: {
  "company": "Google",
  "statusChange": "APPLIED → INTERVIEWING",
  "confidence": "95%"
}
```

### Live Mode Output:
```
Running in LIVE mode
✅ Updated Google status from APPLIED to INTERVIEWING
💾 Exported updates to job_updates_2025-07-03.csv
```

## 🚨 **Safety Tips**

1. **Always test with `yarn dry-run` first**
2. **Start with `yarn live-safe` for initial live runs**
3. **Review CSV exports before bulk changes**
4. **Keep backups of your job tracker data**
5. **Monitor confidence scores - aim for 80%+**

## 🔄 **Troubleshooting**

### Gmail API Issues:
```bash
# Re-authenticate
yarn setup-gmail
```

### Ollama Not Working:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama if needed
ollama serve
```

### Low Classification Accuracy:
- Check `CONFIDENCE_THRESHOLD` in `.env`
- Verify `OLLAMA_MODEL` is downloaded
- Review email content quality

## 📊 **Performance Expectations**

- **Dry-run**: ~20 seconds for 100 emails
- **Live mode**: Same + update time
- **AI Accuracy**: 90-95% with Ollama
- **Confidence**: 80-95% for actionable emails

**Ready to start? Run `yarn dry-run` to see your AI-powered job tracker in action! 🤖**