# Social Knowledge Service

- A "knowledge service" that stores stereotypical social artifacts; posts, people, places, things
- A web interface around this; useful as both a multiplayer experience or a portfolio site
- SIWE (sign in with ethereum) for multiple users
- Static deployment as a SPA app - can be deployed to github pages for example

## Code layout

- `@social/orbital`   — pubsub event messaging backbone
- `@social/knowledge` — knowledge state management
- `@social/server`    — networking wrapper around knowledge service
- `@social/web`       — web interface

### Static deployment

For static deployment (such as for a static portfolio site) the web interface can be built by itself.
It maps the /public filesystem as a web interface using ".info" files to drive layout and content.
Note that github pages can be configured to support SPA routing and this can be deployed there.

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

Copy `.env.example` to `.env` - please refer to document for details.

### Running the Application

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
