#!/bin/sh

echo "Starting application..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until nc -z mongo 27017; do
  echo "MongoDB is unavailable - sleeping"
  sleep 1
done
echo "MongoDB is ready!"

# Load Berkeley seed data
echo "Loading Berkeley seed data..."
npm run seed:berkeley --workspace=@social/knowledge || echo "Seed loading failed or already exists"

# Start the server
echo "Starting server..."
echo "Using npm to run server..."
exec npm run dev --workspace=@social/server