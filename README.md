# Bergen Car Company API

Express + TypeScript backend for [bergenmotors.com](https://bergenmotors.com). Same layered layout as the AutoSalesReviews platform: routes → controllers → services → repositories.

## What it does

| Route | Role |
| --- | --- |
| `GET /api/inventory` | Serves Bergen's mapped lot from an in-memory cache. The cache is filled from AutoSalesReviews (`GET /api/vehicles/dealer/bergen-car`) on a 30-minute timer — never per request. |
| `POST /api/leads` | Validates, stores, and emails a lead (`contact`, `location-contact`, `sell`, `trade`, `financing`, `service`, `test-drive`). |
| `POST /api/newsletter` | Validates and stores a subscriber email. |
| `GET /health` | Liveness. |

## Setup

```bash
cp .env.example .env
# set DATABASE_URL (Postgres) and SMTP credentials
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The API listens on `PORT` (default `4001`). Point the Next.js app at it with `NEXT_PUBLIC_API_URL=http://localhost:4001`.

## Inventory cache

On boot the service fetches AutoSalesReviews once, maps luxury / former-police / commercial flags, and stores the result in memory. A timer refreshes that snapshot every 30 minutes. `GET /api/inventory` only reads the snapshot.

If a refresh fails, the last good snapshot is served and the error is logged. If there is no snapshot yet (cold start and upstream is down), the route returns `503`.

The AutoSalesReviews route is gated by `x-internal-key` / `INTERNAL_API_KEY`. That secret stays on this server — it is never sent to the browser.

## CORS

Origins are an allow-list from `CORS_ORIGIN`. Default production hosts are `bergenmotors.com` and `bergencarcompany.com` (www + apex), plus `http://localhost:3000`.
