[![Join our Discord](https://dcbadge.vercel.app/api/server/PdGCMeXtFG)](https://discord.gg/PdGCMeXtFG)

# Authier

monorepo for Authier password manager
Includes:

- Astro marketing and landing site (`landing-page`)
- web extension
- native Kotlin Android app (`android-app`)
- backend

If you are looking for the download links to use on your devices, use the official download page: https://www.authier.pm/download

**Android:** [Install with Obtainium](https://www.authier.pm/download#android) to
receive updates directly from signed GitHub Releases. See [Android installation](android-app/README.md#install-and-stay-up-to-date).

## Passkeys

Save website passkeys in Authier and sync them between Brave, Firefox and Edge.
See [passkey setup, compatibility and rollout](docs/passkeys.md).

## Running the extension build on Ubuntu

To build the browser extension follow these commands with a current LTS node version:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm install
cd web-extension
cp .env.example .env
pnpm prodBuild
```

## Schema generation

The Android app uses the versioned HTTP/JSON API, generated from shared
Zod/oRPC contracts. GraphQL remains available for existing clients.

```shell
pnpm android:api       # generate OpenAPI and the Kotlin Retrofit client
pnpm android:api:check # check both generated artifacts for drift
pnpm android:build     # build the debug APK (JDK 17 + Android SDK 35)
pnpm android:test      # WebCrypto vectors and native JVM tests
```

See [Android setup](android-app/README.md), the [API contract and rollout notes](backend/orpc/README.md),
and the [encryption protocol](docs/androidCryptoProtocol.md). The Kotlin generator
is pinned and checksum-verified; generated models handle challenge variants,
nullable values, and arbitrary JSON error data. CI builds the APK and checks
the generated contract. API changes require deploying the backend and its
pending migration before the new app can connect to a production account.

Existing GraphQL generation:

```shell
pnpm gbs #backend
pnpm gfs # frontend/extension/mobile
```

or both at once

```shell
pnpm schemas
```

## Getting started

`pnpm i` in the root, pnpm workspaces should install all deps even in subfolders.

## Updating packages

keep in mind that a single package can be in multiple subfolders, so if you update it in one place, make sure to update it everywhere

## How to run locally

Refer to the subproject readmes for client-specific setup. For the new web vault, use [vault-web/README.md](vault-web/README.md).

## API database and deployment

The `authier-api` Cloudflare Worker uses the `HYPERDRIVE` binding to reach the
self-hosted `authier` PostgreSQL database on `192.168.50.200`. Authier has its own
`authier_app` role and Hyperdrive configuration. It shares the existing private
TCP VPC service and Cloudflare Tunnel with Moot. The service verifies the origin
certificate and hostname (`postgres.moot.fyi`); PostgreSQL needs no public port.
Hyperdrive query caching is disabled. The role accepts TLS connections from
loopback and LAN workstations explicitly allowed in `pg_hba.conf`. It has a
20-connection limit and a 30-second statement timeout. Hyperdrive's origin pool
limit is 10. Runtime queries continue to use the
existing Postgres.js/Drizzle driver, with one connection per Worker invocation,
including cron jobs and legacy model helpers. Connections close after work ends.

From `backend`, run `pnpm wrdeploy` for production deployments. It applies
pending migrations through Hyperdrive before deploying, and aborts on failure.
`pnpm db:check:remote` verifies the private connection without changing schema.
Production Cloudflare Workers Builds keeps its deploy command set to
`pnpm run db:migrate && npx wrangler deploy`; `WORKERS_CI=1` selects the same
remote migration path and ignores any legacy Neon `DATABASE_URL` build secret.
Build authentication must allow authenticated Worker previews and the existing
Hyperdrive binding. Preview version uploads remain separate from migrations.

Remote migrations run in a temporary Wrangler preview with no public route or
permanent deployment. Every run generates a fresh authorization token, verifies
the target database and role, and stops the preview afterward. The committed
Drizzle journal is applied atomically under an advisory lock; already applied
hashes must match, with a pinned exception for the existing Prisma introspection
baseline that was commented out after it was marked applied. Payloads are
limited to 1 MiB, 256 migrations and 2,048 SQL
statements. Wrangler's preview tooling runs under Node via `tsx`; the application
and existing Bun scripts retain their runtimes.

For local development, override
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` with your local
PostgreSQL URL. Direct local migrations use `pnpm db:migrate` and `DATABASE_URL`
from the environment or ignored `backend/.env`. Automated tests use PGlite.
Production database credentials belong in Hyperdrive, not Git or Worker vars.

An allowed LAN workstation can connect directly to the production database with
`DATABASE_URL=postgresql://authier_app:<password>@192.168.50.200:5432/authier?sslmode=require`.
Keep the password in an ignored environment file.

The Neon cutover pauses source writes, saves a consistent database export, and
compares every restored table's row count and content checksum, sequence values
and constraints before switching production. Credentials, exports and manifests
stay outside Git in protected migration state directories. Keep the Neon source
read-only after cutover. A rollback must first pause new writes and reconcile
changes made on the self-hosted database before returning traffic to Neon.

# Contributor financial reward scheme

Authier is a non profit organization. If we ever see any profit from this project, it will be divided at the end each month proportionally according to the latest numbers in `contrib-locs.json`.

If you contribute to Authier, your PR gets merged and from next month you will be eligible for a small portion of the profit.
For now this happens manually. We cannot open source our stripe dashboard, but we will expose publicly our stripe balance if there are more than 4 contributors. ATM it's just 2 contributors.

## Contrib locs

For now we're running it manually every week.
It needs to run in node 16, does not run in other node versions, see this issue: https://github.com/nodegit/nodegit/issues/1980
TODO run contrib-locs with github CRON.
