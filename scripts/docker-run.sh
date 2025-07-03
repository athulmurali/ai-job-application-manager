#!/bin/bash

# Job Tracker Docker Runner Script

set -e

echo "🐳 Job Tracker Docker Management"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating template..."
    cp .env.example .env
    print_warning "Please edit .env file with your Gmail API credentials before running."
    exit 1
fi

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker image"
    echo "  run         Run job tracker once (dry-run mode)"
    echo "  live        Run job tracker once (live mode)"
    echo "  start       Start job tracker service"
    echo "  stop        Stop job tracker service"
    echo "  logs        Show logs"
    echo "  shell       Open shell in running container"
    echo "  clean       Remove containers and images"
    echo "  status      Show container status"
    echo "  cron        Start with scheduled runs"
    echo "  help        Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 build      # Build the image"
    echo "  $0 run        # Test run in dry-run mode"
    echo "  $0 live       # Run with live updates"
    echo "  $0 cron       # Start with 4-hour scheduled runs"
}

# Function to build Docker image
docker_build() {
    print_status "Building Job Tracker Docker image..."
    docker build -t job-tracker:latest .
    print_success "Docker image built successfully!"
}

# Function to run once (dry-run)
docker_run() {
    print_status "Running Job Tracker in dry-run mode..."
    docker run --rm \
        --env-file .env \
        -e DRY_RUN=true \
        -v "$(pwd)/exports:/app/exports" \
        -v "$(pwd)/logs:/app/logs" \
        job-tracker:latest
}

# Function to run once (live mode)
docker_live() {
    print_status "Running Job Tracker in LIVE mode..."
    print_warning "This will make actual updates to your job tracker!"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        docker run --rm \
            --env-file .env \
            -e DRY_RUN=false \
            -v "$(pwd)/exports:/app/exports" \
            -v "$(pwd)/logs:/app/logs" \
            job-tracker:latest
    else
        print_status "Cancelled."
    fi
}

# Function to start service
docker_start() {
    print_status "Starting Job Tracker service..."
    docker-compose up -d job-tracker
    print_success "Job Tracker service started!"
    print_status "Use '$0 logs' to view logs"
}

# Function to start with cron
docker_cron() {
    print_status "Starting Job Tracker with scheduled runs..."
    print_warning "This will run automatically every 4 hours in live mode!"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        docker-compose --profile cron up -d
        print_success "Job Tracker with cron scheduling started!"
    else
        print_status "Cancelled."
    fi
}

# Function to stop service
docker_stop() {
    print_status "Stopping Job Tracker service..."
    docker-compose down
    print_success "Job Tracker service stopped!"
}

# Function to show logs
docker_logs() {
    print_status "Showing Job Tracker logs..."
    docker-compose logs -f job-tracker
}

# Function to open shell
docker_shell() {
    print_status "Opening shell in Job Tracker container..."
    docker-compose exec job-tracker /bin/bash
}

# Function to clean up
docker_clean() {
    print_warning "This will remove all Job Tracker containers and images!"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        print_status "Cleaning up..."
        docker-compose down -v
        docker rmi job-tracker:latest 2>/dev/null || true
        print_success "Cleanup completed!"
    else
        print_status "Cancelled."
    fi
}

# Function to show status
docker_status() {
    print_status "Job Tracker container status:"
    docker-compose ps
    echo ""
    print_status "Docker images:"
    docker images | grep job-tracker || echo "No job-tracker images found"
}

# Main script logic
case "${1:-}" in
    build)
        docker_build
        ;;
    run)
        docker_run
        ;;
    live)
        docker_live
        ;;
    start)
        docker_start
        ;;
    stop)
        docker_stop
        ;;
    logs)
        docker_logs
        ;;
    shell)
        docker_shell
        ;;
    clean)
        docker_clean
        ;;
    status)
        docker_status
        ;;
    cron)
        docker_cron
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        print_error "No command specified."
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac