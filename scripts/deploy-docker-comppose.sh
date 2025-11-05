#!/bin/bash

# Social Appliance - Docker Compose Deployment Script
# This script deploys the application using docker-compose to anywhere (not gcloud)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Social Appliance - Docker Compose Deployment${NC}"
echo "=============================================="

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    echo "Install it from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Navigate to docker directory
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT"

cd "$DOCKER_DIR"

# Check if .env file exists in docker directory
if [ ! -f .env ]; then
    echo -e "${RED}Error: docker/.env file not found${NC}"
    echo ""
    echo "Please create docker/.env file with your configuration."
    echo "You can use docker/env-example.txt as a template:"
    echo ""
    echo "  cd docker"
    echo "  cp env-example.txt .env"
    echo "  # Edit .env with your values"
    echo ""
    exit 1
fi

# Build images
echo -e "${GREEN}Step 1: Building Docker images...${NC}"
$DOCKER_COMPOSE build

# Stop existing containers
echo -e "${GREEN}Step 2: Stopping existing containers...${NC}"
$DOCKER_COMPOSE down

# Start services
echo -e "${GREEN}Step 3: Starting services...${NC}"
$DOCKER_COMPOSE up -d

# Wait for services to be healthy
echo -e "${GREEN}Step 4: Waiting for services to be healthy...${NC}"
sleep 5

# Check service status
echo -e "${GREEN}Step 5: Checking service status...${NC}"
$DOCKER_COMPOSE ps

# Get app container logs
echo ""
echo -e "${GREEN}Recent application logs:${NC}"
$DOCKER_COMPOSE logs --tail=20 app

echo ""
echo -e "${GREEN}=============================================="
echo "Deployment Complete!"
echo "=============================================="
echo -e "Application is running at: ${YELLOW}http://localhost${NC}"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo "  View logs: $DOCKER_COMPOSE logs -f"
echo "  View app logs: $DOCKER_COMPOSE logs -f app"
echo "  Stop services: $DOCKER_COMPOSE down"
echo "  Restart services: $DOCKER_COMPOSE restart"
echo "  Rebuild: $DOCKER_COMPOSE build --no-cache"
echo -e "${NC}"

