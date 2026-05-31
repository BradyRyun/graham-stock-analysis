# Stock Analyzer

Web app for viewing fundamental stock metrics with quarterly history. Data comes from **Yahoo Finance** via the unofficial [`yahoo-finance2`](https://github.com/gadicc/yahoo-finance2) package (no API key required). Responses are cached in SQLite on the server.

## Prerequisites

- Node.js 20+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Optional: copy environment file for server port / risk-free rate:

```bash
cp .env.example .env
```

3. Start development (shared package watch, Vite, Express):

```bash
npm run dev
```

- Frontend: http://localhost:5173 (or next free port)
- API: http://localhost:3001

In dev, Vite proxies `/api` to the server, so `VITE_BACKEND_URL` can stay empty.

## Metrics

- P/E, Sharpe ratio, cash flow yield, book value per share, price to book
- Graham NCAV per share: `(current assets − total liabilities) ÷ shares`
- ROE, ROIC, debt to assets
- Quarterly history for the past **1Y** (4 quarters) or **3Y** (12 quarters)

## Project structure

```
packages/shared/   @stock-analyzer/shared — Zod schemas & types
server/            Express API + SQLite cache + Yahoo Finance
src/               Vite React frontend
```

## Data source

Yahoo does not publish a supported public API. This app uses `yahoo-finance2`, which may break if Yahoo changes their endpoints. Fundamentals use the `fundamentalsTimeSeries` module; prices use `chart` (daily adjusted close).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run shared watch, frontend, and server |
| `npm run dev:web` | Frontend only |
| `npm run dev:server` | Server only |
| `npm run build` | Build shared lib, typecheck, and Vite production bundle |

## Caching

Cached in `server/data/cache.db`:

- Symbol search: 7 days
- Symbol metrics bundle: 12 hours
