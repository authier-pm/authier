## General

- this project uses TypeScript across the stack, so type safety is a first-class concern
- runtime is Bun
- create a new abstraction when you find yourself repeating code, keep the code DRY
- The `gh` CLI is installed, use it
- lint with oxlint: `pnpm lint` (or `pnpm lint:fix`) from the repo root, configured in `.oxlintrc.json`. Do not add eslint. Keep `pnpm lint` free of errors; CI and the pre-commit hook run it
  = whenever adding a user-visible UI feature, add or update a checked-in scenario in `web-extension/ui-preview`, render the updated UI, and include a newly captured screenshot in your response. Include it in github PR too if you create one

### File naming

- use kebab-case for folder names
- use camelCase for file names, Capitalize only for classes and React components

## React

- Avoid massive JSX blocks and compose smaller components
- Colocate code that changes together
- Avoid `useEffect` unless absolutely needed
- keep props of components minimal, prefer context or other state management for any state/data
- import { useState, useEffect, useCallback, useMemo } from 'react'. Avoid using `React.useState` etc

## TypeScript

- avoid `try`/`catch` unless absolutely necessary. We want to fail fast and see the original stack trace. Let errors propagate up to the caller from all the way down.
- never cast to `any`
- use named exports when possible
- avoid async imports, always import stuff at the top level
- nested ternaries are forbidden

### Database in tests

- use pglite in all tests requiring database access
- Always setup a test database with some data in beforeAll() and close it in afterAll()- use
  setupTestDb() like this for example:

```ts
import { setupTestDb } from '@workspace/api/src/db/test-setup'

beforeAll(async () => {
  client = await setupTestDb()
})
```

never write tests against a real database. We run all tests against pglite in memory.

## Database Migrations

Use `pnpm db:generate` to generate new migrations.
Run pending migrations before every backend production deployment; abort deployment if migration fails.
Use `pnpm wrdeploy` from `backend` for local deployments; it runs migrations before Wrangler.
Production CI deployments run in Cloudflare Workers Builds, independently of `.github/workflows/main.yml`.
Keep its production deploy command set to `pnpm run db:migrate && npx wrangler deploy`.
With `WORKERS_CI=1`, migrations use a temporary authenticated Worker preview bound to production Hyperdrive,
so builds do not need direct LAN access or a `DATABASE_URL` build secret. Local `pnpm wrdeploy` selects the
same remote migration path explicitly. Runtime database credentials are managed by Hyperdrive.
Keep preview version uploads separate from production migrations.

## Marketing

Crucial part of any OSS product is marketing. This project is no exception. We need to make sure that we are marketing our product in the right way. Here are some guidelines:

- never ask me to help you with marketing. I will not do it. You are solely responsible for marketing your product. For example if there is a captcha on a catalogue page where you want to submit Authier either break the captcha or find another catalogue.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
