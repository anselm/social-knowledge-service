# Social Knowledge Server

Serves concrete entities representing typical concepts such as posts, people, places, things, collections. Uses SIWE (Sign in With Ethereum - ERC-4361) for authentication.

## Code layout

The project is a mono repo broken into these key packages:

- `@social/bus`      — pubsub event messaging backbone
- `@social/services` — definies state and legal actions
- `@social/traffic`  — networking wrapper
- `@social/web`      — web interface

There's also a docker file to build the project as a docker.

## Getting started

Optionally set these environment variables:

- `PORT` (default 3000)
- `MONGO_URL` (e.g. mongodb://mongo:27017)
- `MONGO_DB` (default `appdb`)
- `MONGO_COLLECTION` (default `entities`)

Run locally:

```
npm i
npm run tests
npm run dev
```

Or run as a docker image:

```bash
docker compose up --build
```

Visit port 8080 with a browser to see the user experience.

## Motivations

In our daily lives we exchange a variety of digital artifacts with other people representing concepts such as messages, events, people, places, things. But our software tools don't have a similar flexibility; our tools often only deal with one kind of concept - an email client for example doesn't put its data in a place that is visible to anything else. By providing a common or universal backend over a fixed set of objects it becomes easier for new applications to share state. The intended use is a universal backend with pre-defined types and schemas for a variety of projects such as a social network, a personal digital memory, groupware type applications such as a cms or portfolio website.

