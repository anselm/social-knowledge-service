#!/bin/bash

# Social Appliance - Google Cloud Run Deployment Script
# This helper script builds and deploys the application to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Social Appliance - Google Cloud Run Deployment${NC}"
echo "=============================================="

# Navigate to project root (monorepo root where .env is located)
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
echo -e "${GREEN}Working from project root: $PROJECT_ROOT${NC}"

# Load environment variables from .env file in project root
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env file...${NC}"
    # Simple and reliable approach: source the .env file directly
    # This handles quotes and special characters better than grep/sed approach
    set -a
    source .env
    set +a
    echo -e "${GREEN}Environment variables loaded successfully${NC}"
    # Debug: Show key variables that were loaded
    echo -e "${GREEN}Key variables loaded:${NC}"
    echo -e "  GCLOUD_PROJECT_ID: ${GCLOUD_PROJECT_ID:-<not set>}"
    echo -e "  GCLOUD_REGION: ${GCLOUD_REGION:-<not set>}"
    echo -e "  GCLOUD_SERVICE_NAME: ${GCLOUD_SERVICE_NAME:-<not set>}"
    if [ -n "$MONGODB_URI" ]; then
        echo -e "  MONGODB_URI: ${MONGODB_URI:0:50}... (loaded successfully)"
    else
        echo -e "  MONGODB_URI: <not set>"
    fi
else
    echo -e "${YELLOW}Warning: .env file not found in project root${NC}"
    echo "Checking for environment variables..."
fi

# Configuration - use env vars or defaults
PROJECT_ID="${GCLOUD_PROJECT_ID}"
REGION="${GCLOUD_REGION:-us-central1}"
SERVICE_NAME="${GCLOUD_SERVICE_NAME:-social-appliance}"
IMAGE_NAME="social-appliance"
IMAGE_TAG="latest"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCLOUD_PROJECT_ID is not set${NC}"
    echo "Please set it in your .env file or export it:"
    echo "  export GCLOUD_PROJECT_ID=your-project-id"
    exit 1
fi

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}Error: MONGODB_URI is not set${NC}"
    echo "Please set it in your .env file or export it:"
    echo "  export MONGODB_URI=your-mongodb-atlas-uri"
    echo "Get a free MongoDB Atlas cluster at: https://www.mongodb.com/cloud/atlas"
    exit 1
fi

echo -e "${YELLOW}Project ID: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"
echo -e "${YELLOW}Service: ${SERVICE_NAME}${NC}"
echo -e "${YELLOW}MongoDB URI: ${MONGODB_URI:0:30}...${NC}"
echo ""

# Authenticate with Google Cloud
echo -e "${GREEN}Step 1: Authenticating with Google Cloud...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Set project
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${GREEN}Step 2: Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository if it doesn't exist
echo -e "${GREEN}Step 3: Ensuring Artifact Registry repository exists...${NC}"
gcloud artifacts repositories create ${IMAGE_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Social Appliance Docker images" \
    2>/dev/null || echo "Repository already exists"

# Build Docker image
echo -e "${GREEN}Step 4: Building Docker image...${NC}"
GCR_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "${YELLOW}Building image: ${GCR_IMAGE}${NC}"
echo -e "${YELLOW}Using Dockerfile at: ./Dockerfile${NC}"

# Verify Dockerfile exists
if [ ! -f Dockerfile ]; then
    echo -e "${RED}Error: Dockerfile not found in project root${NC}"
    echo "Make sure you're running this script from the monorepo root directory"
    exit 1
fi

docker build -f Dockerfile -t ${GCR_IMAGE} .

# Push to Google Container Registry
echo -e "${GREEN}Step 5: Pushing image to Artifact Registry...${NC}"
docker push ${GCR_IMAGE}

# Deploy to Cloud Run
# Note: PORT is automatically set by Cloud Run, so we don't include it in env vars
echo -e "${GREEN}Step 6: Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image=${GCR_IMAGE} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production,MONGODB_URI=${MONGODB_URI},MONGODB_NAME=${MONGODB_NAME:-social-appliance},MAGIC_SECRET_KEY=${MAGIC_SECRET_KEY:-}" \
    --timeout=300

# Get service URL
echo -e "${GREEN}Step 7: Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform=managed \
    --region=${REGION} \
    --format='value(status.url)')

echo ""
echo -e "${GREEN}=============================================="
echo "Deployment Complete!"
echo "=============================================="
echo -e "Service URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "Access your app at: ${YELLOW}${SERVICE_URL}${NC}"
echo ""
echo -e "${GREEN}Important Notes:${NC}"
echo "1. Cloud Run is stateless - using MongoDB Atlas for database"
echo "2. Authentication is stateless - client sends tokens with each request"
echo "3. CORS allows all origins by default"
echo "4. Cloud Run automatically sets PORT environment variable (8080)"
echo "5. For custom domain, see: https://cloud.google.com/run/docs/mapping-custom-domains"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo "  View logs: gcloud run services logs read ${SERVICE_NAME} --region=${REGION}"
echo "  Update service: gcloud run services update ${SERVICE_NAME} --region=${REGION}"
echo "  Delete service: gcloud run services delete ${SERVICE_NAME} --region=${REGION}"
echo ""
echo -e "${GREEN}Configuration loaded from .env file${NC}"
echo "  GCLOUD_PROJECT_ID=${PROJECT_ID}"
echo "  MONGODB_URI=${MONGODB_URI:0:30}..."
echo -e "${NC}"
