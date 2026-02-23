## General

- this project uses TypeScript across the stack, so type safety is a first-class concern
- runtime is Bun
- create a new abstraction when you find yourself repeating code, keep the code DRY
- The `gh` CLI is installed, use it

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
- avoid casting to `any`
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

use `pnpm db:generate` to generate new migration NEVER ever under no circumstances run `db:migrate`.
User will run it themselves manually on all deployed environments.
