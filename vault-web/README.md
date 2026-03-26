# Vault Web Local Development

This app is the new web vault built with Vite, Tailwind, shadcn/ui, and oRPC.

## Prerequisites

- `pnpm`
- Docker
- `psql`

Install workspace dependencies once from the repo root:

```bash
pnpm install
```

## 1. Configure the backend

Create a local backend env file:

```bash
cd backend
cp .env.sample .env
```

Update `backend/.env` so it works with the local Postgres container and the vault dev server:

```env
NODE_ENV=development
PORT=5051
DATABASE_URL=postgresql://authier:auth133r@localhost:6432/authier
FRONTEND_URL=http://localhost:5173
ACCESS_TOKEN_SECRET=auth133r_access
REFRESH_TOKEN_SECRET=auth133r_refresh
COOKIE_SECRET=auth133r_cookie
```

You can keep the other values from `backend/.env.sample`.

## 2. Start Postgres

From `backend/`:

```bash
pnpm docker:up
```

This starts Postgres on `localhost:6432`.

## 3. Bootstrap the local database

If your local database is empty, load the checked-in base schema:

```bash
psql postgresql://authier:auth133r@localhost:6432/authier -f backend/drizzle/migrations/base.sql
```

Run that from the repo root. Do not use `pnpm db:migrate`.

## 4. Start the backend

Run the backend on the vault's expected local port:

```bash
cd backend
pnpm local
```

That serves:

- GraphQL at `http://localhost:5051/graphql`
- oRPC at `http://localhost:5051/rpc`

`pnpm local` uses `wrangler dev --port 5051`, and Wrangler loads values from `backend/.env`.

## 5. Start the vault web app

In a second terminal:

```bash
cd vault-web
pnpm dev
```

Open `http://localhost:5173`.

The vault defaults to `http://localhost:5051` via [env.ts](/home/capaj/work-repos/authier-repos/authier2/vault-web/src/env.ts), so no extra frontend env is needed for the normal local setup.

## One-command option

After the database is up and initialized, you can run the backend and vault together from the repo root:

```bash
pnpm dev:vault
```

This uses Turbo to run the backend `local` task and the vault `local` task in parallel.

## Optional commands

Run vault tests:

```bash
cd vault-web
pnpm test
```

Build the vault:

```bash
cd vault-web
pnpm build
```

Run the backend oRPC tests:

```bash
cd backend
pnpm exec vitest run orpcHandler.spec.ts
```

## Troubleshooting

- If the vault cannot reach the API, make sure the backend is running on `http://localhost:5051`.
- If you run the backend on any port other than `5051`, set `VITE_API_ORIGIN` for the vault so it points to the actual backend URL.
- If login or registration fails immediately on a fresh machine, the usual cause is an empty local database that has not been initialized with `backend/drizzle/migrations/base.sql`.
