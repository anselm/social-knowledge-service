# Social Knowledge Service

- A "knowledge service" that stores stereotypical social artifacts; posts, people, places, things
- A web interface around this; useful as both a multiplayer experience or a portfolio site
- SIWE (sign in with ethereum) for multiple users
- Static deployment as a SPA app - can be deployed to github pages for example

## Quick Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (copy .env.example to .env and configure)

# 3. Build and start with automatic seeding
npm run dev  # Builds packages, seeds root entity, starts server

# 4. Optional: Load sample data for development
npm run seed:berkeley  # Adds Berkeley-area posts and relationships
```

**Note**: `npm run dev` automatically runs `seed:root` to ensure the essential root entity exists. For additional sample data, run `seed:berkeley` separately.

## Packages

- `@social/orbital`   — pubsub event messaging backbone
- `@social/knowledge` — knowledge state management
- `@social/server`    — networking wrapper around knowledge service
- `@social/web`       — web interface

## Static deployment

For static deployment (such as for a static portfolio site) the web interface can be built by itself. (See packages/web)

Static deployment maps the /public filesystem as a web interface using ".info" files to drive layout and content.

Note that github pages can be configured to support SPA routing and this can be deployed there.

## Dynamic Deployment

For non-static deployment this project requires MongoDB to be running. For local development on macOS:

```bash
# Install MongoDB using Homebrew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Stop MongoDB service when needed
brew services stop mongodb-community
```

### Dynamic Environment Variables

Copy `.env.example` to `.env` - please refer to document for details.

### Dynamic Running the Application

Run locally:

```
npm i
npm run dev
```

Or run as docker image:

```bash
docker compose up --build
```

Visit port 8080 with a browser to see the user experience.

### Deploy to Google Cloud

Deploy to Google Cloud Run (stateless, uses MongoDB Atlas):

1. **Set up MongoDB Atlas:**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string (mongodb+srv://...)
   - Whitelist Cloud Run IP ranges or use 0.0.0.0/0 for testing on atlas console

2. **Install Google Cloud SDK:**

```bash
# macOS
brew install google-cloud-sdk

# Ubuntu/Debian
sudo apt-get install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

3. **Authenticate:**

```bash
gcloud auth login
gcloud auth configure-docker
```

4. **Configure environment variables in root .env file which docker picks up:**

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-appliance
GCLOUD_PROJECT_ID=your-project-id
GCLOUD_REGION=us-central1
GCLOUD_SERVICE_NAME=social-appliance
```

5. **Deploy to Google Cloud Run:**
```bash
npm run gcloud:run
```

The script will automatically read your root `.env` file and:
- Build the Docker image (builds client and includes it)
- Push to Google Artifact Registry
- Deploy to Cloud Run on port 8080
- Configure environment variables
- Set up automatic scaling

6. **Access your application:**
   - Cloud Run will provide a URL like: https://social-appliance-xxxxx-uc.a.run.app

7. **Useful commands:**
```bash
# View logs
gcloud run services logs read social-appliance --region=us-central1

# Update environment variables
gcloud run services update social-appliance --region=us-central1 \
  --set-env-vars="KEY=value"

# Delete service
gcloud run services delete social-appliance --region=us-central1
```
