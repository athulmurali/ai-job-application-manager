# Multi-stage build for Job Tracker with Ollama
FROM ubuntu:22.04 as base

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install dependencies
RUN npm install -g yarn && yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Create directory for Ollama models
RUN mkdir -p /root/.ollama

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Job Tracker with Ollama..."

# Start Ollama in background
echo "📡 Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Check if model exists, if not download it
echo "🧠 Checking for Llama 3.1 model..."
if ! ollama list | grep -q "llama3.1:8b"; then
    echo "📥 Downloading Llama 3.1:8b model (this may take several minutes)..."
    ollama pull llama3.1:8b
    echo "✅ Model downloaded successfully!"
else
    echo "✅ Llama 3.1:8b model already available!"
fi

# Start the job tracker
echo "🔍 Starting Job Tracker..."
exec node dist/index.js
EOF

RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 11434 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/tags || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV OLLAMA_HOST=0.0.0.0:11434

# Start the application
CMD ["/app/start.sh"]