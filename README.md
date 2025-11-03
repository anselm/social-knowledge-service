# Social Appliance

A social knowledge service.

## Features

- A multiplayer social web experience
- Supports multiple users with SIWE (Sign in With Ethereum - ERC-4361) for authentication.
- May also be used as a totally static portfolio website such as on github pages

## Code layout

- `@social/orbital`   — pubsub event messaging backbone
- `@social/knowledge` — knowledge state management (see [README](packages/knowledge/README.md)
- `@social/server`    — networking wrapper around knowledge package
- `@social/web`       — web interface [README](packages/web/README.md)

## Getting started

### Static deployment

Build the web interface and copy it to any SPA web service. Github pages can be configured to support SPA apps. See the web app [README](packages/web/README.md) for more details.

### Dynamic Deployment

For non-static deployment this project requires MongoDB to be running. For local development on macOS:

```bash
# Install MongoDB using Homebrew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Stop MongoDB service when needed
brew services stop mongodb-community
```

### Environment Configuration

Copy `.env.example` to `.env` - please refer to this document for the variables.

### Running the Application

Run locally:

```
npm i
npm run dev
```

Or run as a docker image:

```bash
docker compose up --build
```

Visit port 8080 with a browser to see the user experience.
