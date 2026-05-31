# Stock Analyzer

Simple stock metrics app with a Vite React frontend and Express backend.

## Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm i
```

3. Start development:

```bash
npm run dev
```

## What runs

- Frontend: Vite app
- Backend: Express API
- Shared types: `packages/shared`

## Notes

- Frontend is proxied to the backend in development
- The server caches data in `server/data/cache.db`
