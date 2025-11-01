# Social Knowledge Server

Serves concrete entities representing typical concepts such as posts, people, places, things, collections. Uses SIWE (Sign in With Ethereum - ERC-4361) for authentication.

## Motivations

In our daily lives we exchange a variety of digital artifacts with other people representing concepts such as messages, events, people, places, things. But our software tools don't have a similar flexibility; our tools often only deal with one kind of concept - an email client for example doesn't put its data in a place that is visible to anything else. By providing a common or universal backend over a fixed set of objects it becomes easier for new applications to share state. The intended use is a universal backend with pre-defined types and schemas for a variety of projects such as a social network, a personal digital memory, groupware type applications such as a cms or portfolio website.

## Code layout

The project is a mono repo broken into these key packages:

- `@social/bus`      — pubsub event messaging backbone
- `@social/knowledge` — definies state and legal actions
- `@social/server`    — networking wrapper - serves web
- `@social/web`      — web interface

There's also a docker file to build the project as a docker.

## Getting started

### Prerequisites

This project requires MongoDB to be running. For local development on macOS:

```bash
# Install MongoDB using Homebrew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Stop MongoDB service when needed
brew services stop mongodb-community
```

### Environment Configuration

Copy `.env.example` to `.env` and optionally customize these variables:

- `PORT` (default 8080)
- `MONGO_URL` (default mongodb://localhost:27017)
- `MONGO_DB` (default social_knowledge_server)
- `MONGO_COLLECTION` (default entities)

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

