# Authier HTTP API v1

The HTTP API serves ordinary JSON at `/api/v1` with the checked-in specification at
`shared/openapi/authier.json` and `/api/v1/openapi.json`. It uses the same Zod/oRPC
contracts and authentication handlers as `/rpc`. GraphQL and existing RPC paths
remain available. Regenerate with `pnpm --dir backend api:generate`; CI can check
for drift with `pnpm --dir backend api:check`.

Send `Authorization: Bearer <accessToken>` and `Content-Type: application/json`.
All operations are POST requests, including reads, so inputs have consistent JSON
body encoding. Public auth operations and their payloads are described by the
OpenAPI document; `/auth/logout` requires authentication. Refresh tokens are sent
explicitly in `{ "refreshToken": "..." }` on native clients. Token expiration,
device revocation, account token-version changes and account/device mismatch are
checked on every protected request. Clients must protect refresh tokens at rest.

## Incremental synchronization

1. Start with `POST /vault/sync` and `{ "limit": 100 }`. Do not derive a cursor from
   wall-clock time, session bootstrap, or the result of a write.
2. Apply each `changes` entry in order to a local encrypted store. A non-null
   `secret.deletedAt` removes the item; do this before attempting decryption.
3. Persist `nextCursor` in the same local transaction as those changes. On an
   interrupted transaction, request the old cursor again.
4. Request the next page with `{ "cursor": "...", "limit": 100 }` while `hasMore`
   is true. Retain the last cursor for the next online synchronization.

Cursors are opaque, versioned and scoped to the account and device's `syncTOTP`
policy. Omitted cursor (or `"0"`) replays the complete history, including a migration
backfill of existing records and tombstones. Do not parse, compare, or synthesize
cursor strings. `CURSOR_INVALID` (HTTP 400) instructs a client to clear its local
remote snapshot and cursor, retain any pending local edits separately, and replay
without a cursor. Other HTTP 400 errors do not request a reset.

When TOTP synchronization is disabled, TOTP changes are returned as tombstones
with empty `encrypted` fields. This also removes a cached password that another
device changed into a TOTP item. Other records retain their original encrypted
payload. After a policy change, cursors from the previous policy are invalidated.
Passkeys synchronize normally when TOTP synchronization is disabled. Passwords
and passkeys share the account's credential quota, including when an update
changes an item's kind.

The API maintains an immutable `VaultChange` log through
`backend/vault/vaultWrites.ts`. Every application write enters one transaction
that locks the account row before changing vault records, validates quotas,
advances per-secret versions, allocates account revisions, and appends the
returned records. The lock is held through commit, so later committed revisions
cannot overtake earlier uncommitted ones. A sequence alone does not provide that
guarantee. Failed transactions roll back the records, log entries and counter.
The database contains ordinary tables and constraints; it has no vault triggers
or stored procedures.

The shared service covers `UserMutation.addEncryptedSecrets`,
`removeEncryptedSecrets`, `changeMasterPassword`, `EncryptedSecretMutation.update`
and `delete`, legacy oRPC mutations, and the new mobile mutations. Normal deletes
are soft deletes with versioned tombstones. Future imports, maintenance scripts
and new endpoints must use this service. Direct SQL writes intentionally do not
run application logic and therefore do not create sync entries. Account deletion
cascades its data and history.

Merge all pages into the local **encrypted** store before decrypting its current
live records: historical change entries can contain ciphertext from before a
master-password change. When combining write responses and sync results, avoid
replacing a higher locally cached version with an older replayed snapshot.

Legacy timestamp synchronization now returns a complete snapshot, including soft
deletion records. `markAsSynced` remains informational and cannot create a gap in
that snapshot. Normal application deletes remain soft deletes. Existing clients should migrate
to cursor synchronization to avoid repeatedly downloading the entire vault.

The log and successful operation records currently remain for the lifetime of the
account. They can grow with edit history. Do not prune them until a retention and
cursor-expiration policy plus client reset behavior is implemented and tested.
Initial sync replays historical ciphertext and can require multiple pages. This
first contract favors correctness and compatibility over log compaction.

## Writes, conflicts and retries

Use client-generated UUIDs for secret `id` and `operationId`:

- `/vault/create`: `{ operationId, id, encrypted, kind }`
- `/vault/update`: `{ operationId, id, encrypted, kind, expectedVersion }`
- `/vault/delete`: `{ operationId, id, expectedVersion }`

Each operation returns the encrypted secret record, including the committed
`version` and nullable `deletedAt`. The encrypted format is unchanged: the server
never receives the vault key or decrypted secret content. Ciphertext writes are
limited to 1,048,576 characters per item; sync pages allow 1–500 changes (default 100).

Persist the entire mutation in an outbox **before** sending it. Retries must reuse
exactly the same operation id and fields, including the same ciphertext and IV.
The reservation, write, quota check and stored response commit atomically. A
successful retry returns the original response even if the item has since changed
again. Reusing an operation id with different content produces `CONFLICT` (409).
Failed transactions do not consume operation ids.

Updates and deletes compare `expectedVersion` atomically. One concurrent edit can
succeed; a stale edit receives `CONFLICT` (409), with `data.currentVersion` when
available. Preserve the user's local edit, synchronize, then resolve the conflict
explicitly. Do not silently update the expected version and overwrite the remote
item. A new resolved write needs a new operation id. `NOT_FOUND` (404) does not
reveal whether another account owns that id. Existing legacy write operations
still lack an expected-version field, so they retain their older overwrite
semantics, while their version increments and change tracking are enforced by the
API service.

Master-password rotation requires the complete current set of active secrets,
with each `EncryptedSecretPatchInput.expectedVersion` matching its current
version. A concurrent create, edit, or delete causes the entire rotation to fail
without replacing ciphertext or enrollment keys; synchronize and prepare a new
complete snapshot before retrying. The field remains optional in the legacy
GraphQL schema, but a rotation with missing versions is rejected with an upgrade
message. Older clients, including the retired React Native app, must upgrade
before rotating a nonempty vault. A successful rotation increments every active
secret's version exactly once and invalidates prior account tokens.

All application vault writes recheck the token generation and current device
under the account lock. A write authenticated before a password rotation cannot
queue behind that rotation and commit ciphertext encrypted with the old key.
Rotation also rechecks the persisted master device under that same lock;
enrollment and rotation consistently lock the account before a challenge.

The production migration was generated using `pnpm db:generate` and augmented
with the backfill and API service. Deploy it before serving this code. It
locks `EncryptedSecret` during backfill; size the deployment window to existing
vault volume. Pause vault writes across the migration and the switch to the new
API code, or use a coordinated maintenance deployment: an older server instance
can otherwise write without the new API change tracking after the backfill. Deployment commands already run migrations first.
No migration or code in this change has been deployed to production.

## Contract compatibility

Keep `/api/v1` stable for shipped Android versions. Add optional input and output
fields compatibly; avoid renaming enum values or changing encryption semantics.
Breaking changes require another API version or explicit negotiated support.
Shared TypeScript/Kotlin crypto vectors and client generation validate the wire
format. Backend database tests use PGlite, including generated-migration backfill,
rollback, page boundaries, retries, conflicts and legacy-writer coverage. PGlite
serializes its single connection, so parallel request tests validate outcomes but
do not simulate PostgreSQL's multi-connection lock scheduler.

## Local native integration

`pnpm --dir backend api:smoke` starts the real HTTP handlers on
`http://127.0.0.1:5052/api/v1` backed exclusively by an ephemeral PGlite database.
It uses Bun with the same Vite/SWC module transformation as tests because the
legacy generated GraphQL models contain circular decorator metadata. Emails are
disabled and data disappears when the process stops. Connect an Android emulator
with `adb reverse tcp:5052 tcp:5052`. Geolocation and Redis-dependent ancillary
features require separate local substitutes; registration and vault integration
can run without those services.

`api:verify-native` enrolls a separate TypeScript/WebCrypto device against that
local server, decrypts the synthetic native-created item, verifies its fixture
values, then writes `TypeScript smoke login` for the native app to synchronize.
Set `AUTHIER_SMOKE_EMAIL` and `AUTHIER_SMOKE_PASSWORD`; optional
`AUTHIER_SMOKE_EXPECT_LABEL`, `AUTHIER_SMOKE_EXPECT_USERNAME`,
`AUTHIER_SMOKE_EXPECT_PASSWORD`, and `AUTHIER_SMOKE_EXPECT_URL` select the
expected synthetic item. The CLI rejects remote hosts and prints verification
booleans and item identifiers, never tokens or passwords. If it requests device
approval, approve the named smoke device and rerun. Set `AUTHIER_SMOKE_DEVICE_ID`
when testing another account with the same ephemeral server.
