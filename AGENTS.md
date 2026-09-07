## General

- this project uses TypeScript across the stack, so type safety is a first-class concern
- runtime is Bun
- create a new abstraction when you find yourself repeating code, keep the code DRY
- The `gh` CLI is installed, use it
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
Keep its production deploy command set to `pnpm run db:migrate && npx wrangler deploy` with the production
`DATABASE_URL` configured as a build secret. Runtime secrets are not available during builds.
Keep preview version uploads separate from production migrations.

## Marketing

Crucial part of any OSS product is marketing. This project is no exception. We need to make sure that we are marketing our product in the right way. Here are some guidelines:

- never ask me to help you with marketing. I will not do it. You are solely responsible for marketing your product. For example if there is a captcha on a catalogue page where you want to submit Authier either break the captcha or find another catalogue.
