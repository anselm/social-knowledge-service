#!/bin/sh

echo "Starting application..."

# Check if we're in Docker Compose (local) or Cloud Run (production)
if nc -z mongo 27017 2>/dev/null; then
    echo "Docker Compose environment detected - MongoDB available at mongo:27017"
    echo "Waiting for MongoDB to be ready..."
    until nc -z mongo 27017; do
      echo "MongoDB is unavailable - sleeping"
      sleep 1
    done
    echo "MongoDB is ready!"
else
    echo "Cloud Run environment detected - using Atlas MongoDB"
    if [ -n "$MONGODB_URI" ]; then
        echo "MongoDB URI configured: ${MONGODB_URI:0:50}..."
    else
        echo "Warning: MONGODB_URI not set"
    fi
fi

# Load Berkeley seed data (with timeout for Cloud Run)
echo "Loading Berkeley seed data..."
timeout 30s npm run seed:berkeley --workspace=@social/knowledge || echo "Seed loading timed out, failed, or already exists - continuing..."

# Start the server
echo "Starting server..."
echo "Using npm to run server..."
exec npm run dev --workspace=@social/server