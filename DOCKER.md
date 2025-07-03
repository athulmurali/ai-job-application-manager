# 🐳 Docker Setup for Job Tracker with Ollama

This guide shows how to run your job tracker in a Docker container with Ollama AI built-in.

## 🎯 **What's Included**

- ✅ **Ubuntu 22.04** base image
- ✅ **Node.js 20** for running the job tracker
- ✅ **Ollama** with Llama 3.1:8b model
- ✅ **Automatic model download** on first run
- ✅ **Health checks** and monitoring
- ✅ **Volume persistence** for models and exports
- ✅ **Scheduled runs** with cron (optional)

## 🚀 **Quick Start**

### 1. **Build the Docker Image**
```bash
./scripts/docker-run.sh build
```

### 2. **Test Run (Dry-Run Mode)**
```bash
./scripts/docker-run.sh run
```

### 3. **Live Mode (Real Updates)**
```bash
./scripts/docker-run.sh live
```

## 📋 **Available Commands**

```bash
./scripts/docker-run.sh [COMMAND]

Commands:
  build       Build the Docker image
  run         Run job tracker once (dry-run mode)
  live        Run job tracker once (live mode)
  start       Start job tracker service
  stop        Stop job tracker service
  logs        Show logs
  shell       Open shell in running container
  clean       Remove containers and images
  status      Show container status
  cron        Start with scheduled runs (every 4 hours)
  help        Show help
```

## ⚙️ **Configuration**

### Environment Variables (.env)
```bash
# Required: Gmail API credentials
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_ACCESS_TOKEN=your_access_token
GMAIL_REFRESH_TOKEN=your_refresh_token

# Optional: Behavior configuration
DRY_RUN=true                    # Set to false for live mode
EMAIL_DAYS_BACK=30             # Days to look back
CONFIDENCE_THRESHOLD=0.8       # AI confidence threshold
USE_OLLAMA=true                # Enable Ollama AI
OLLAMA_MODEL=llama3.1:8b       # AI model to use
```

## 🔄 **Usage Scenarios**

### **Scenario 1: One-Time Dry Run**
```bash
# Test classification without making changes
./scripts/docker-run.sh run
```

### **Scenario 2: Manual Live Updates**
```bash
# Run with actual updates when ready
./scripts/docker-run.sh live
```

### **Scenario 3: Background Service**
```bash
# Start as persistent service
./scripts/docker-run.sh start

# View logs
./scripts/docker-run.sh logs

# Stop when done
./scripts/docker-run.sh stop
```

### **Scenario 4: Scheduled Automation**
```bash
# Start with automatic 4-hour runs
./scripts/docker-run.sh cron

# Monitor with logs
./scripts/docker-run.sh logs
```

## 📊 **Resource Requirements**

| Component | CPU | RAM | Storage |
|-----------|-----|-----|---------|
| **Node.js App** | 0.5 CPU | 512MB | 100MB |
| **Ollama + Llama 3.1:8b** | 2-4 CPU | 6-8GB | 5GB |
| **Total Recommended** | **4 CPU** | **8GB** | **10GB** |

## 🗂️ **Volume Mounts**

```bash
./logs/          # Application logs
./exports/       # CSV exports and reports
~/.ollama/       # Ollama models (persistent)
```

## 🚀 **Advanced Docker Commands**

### **Direct Docker Commands**
```bash
# Build image
docker build -t job-tracker:latest .

# Run once (dry-run)
docker run --rm --env-file .env \
  -v $(pwd)/exports:/app/exports \
  job-tracker:latest

# Run with live updates
docker run --rm --env-file .env \
  -e DRY_RUN=false \
  -v $(pwd)/exports:/app/exports \
  job-tracker:latest
```

### **Docker Compose**
```bash
# Start service
docker-compose up -d

# Start with cron scheduling
docker-compose --profile cron up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

## 🔍 **Monitoring & Debugging**

### **Check Container Status**
```bash
./scripts/docker-run.sh status
```

### **View Real-Time Logs**
```bash
./scripts/docker-run.sh logs
```

### **Access Container Shell**
```bash
./scripts/docker-run.sh shell
```

### **Health Checks**
```bash
# Check if Ollama is responding
curl http://localhost:11434/api/tags

# Check container health
docker inspect job-tracker-app --format='{{.State.Health.Status}}'
```

## 🐛 **Troubleshooting**

### **Model Download Issues**
```bash
# Check if model is downloaded
./scripts/docker-run.sh shell
ollama list

# Manually download if needed
ollama pull llama3.1:8b
```

### **Memory Issues**
```bash
# Use smaller model if RAM is limited
docker run --env-file .env \
  -e OLLAMA_MODEL=phi3:mini \
  job-tracker:latest
```

### **Permission Issues**
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./logs ./exports
```

## 📈 **Performance Optimization**

### **For Development (Faster)**
```bash
# Use smaller, faster model
echo "OLLAMA_MODEL=phi3:mini" >> .env
```

### **For Production (More Accurate)**
```bash
# Use full model with resource limits
docker-compose up --scale job-tracker=1
```

### **For Cloud Deployment**
```bash
# Use multi-architecture build
docker buildx build --platform linux/amd64,linux/arm64 -t job-tracker:latest .
```

## 🔒 **Security Notes**

- ✅ **Environment isolation** - Runs in container
- ✅ **No external network** access for Ollama
- ✅ **Volume-mounted secrets** - `.env` file not in image
- ✅ **Non-root user** option available
- ⚠️ **Gmail credentials** - Keep `.env` file secure

## 🚀 **Ready to Dockerize!**

```bash
# 1. Build the image
./scripts/docker-run.sh build

# 2. Test it works
./scripts/docker-run.sh run

# 3. Go live when ready!
./scripts/docker-run.sh live
```

**Your job tracker is now containerized with AI! 🤖🐳**