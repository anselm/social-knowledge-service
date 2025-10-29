# Social Appliance

A social networking app

The project is a mono repo broken into these key packages:

- `@social/bus` — a pub sub backbone used heavily
- `@social/services` — a collection of service largely defining the app
- `@social/traffic` — networking, including cors
- `@social/web` — web ap

There's also a docker file to build the project as a docker

## Getting started

Set these environment variables:

- `PORT` (default 3000)
- `MONGO_URL` (e.g. mongodb://mongo:27017)
- `MONGO_DB` (default `appdb`)
- `MONGO_COLLECTION` (default `entities`)

```bash
docker compose up --build
```

Then visit port 8080 with a browser
