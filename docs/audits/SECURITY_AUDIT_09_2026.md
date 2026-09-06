# Authier Password Manager — Security Audit

- Date (UTC): 2026-09-06
- Scope: `backend/` (Elysia + GraphQL Yoga + oRPC + Drizzle), `shared/` (crypto, URL, oRPC contract), `vault-web/` session/token storage, `web-extension/` autofill + local storage.
- Methodology: static review of auth, crypto, resolvers, and autofill paths, plus dynamic reproduction against the real server stack (`buildApp`) with a PGlite database. All dynamic proofs below passed (9/9) at audit time via a temporary vitest spec (since removed); each finding cites the proof ID (A1–A9).

> Note: `backend/.env` in the audited working tree contains live secrets (Stripe live key, Mailjet keys, Firebase private key, Neon DB URL, Redis URL) with `NODE_ENV=development`. The file itself is gitignored (only `.env.sample` is tracked), so this is a local-handling risk, not a committed leak — but production must never run from that file as-is (see M-8).

## Severity key

- **Critical**: directly leaks or destroys another user's vault data, or silently exfiltrates credentials.
- **High**: account takeover / vault decryption with one additional common precondition (phished password, victim click, XSS, DB read).
- **Medium**: info disclosure, oracle, or hardening failure that aids attacks or breaks a safety control.
- **Low**: defense-in-depth / best-practice gap.

## Findings summary

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| C-1 | Cross-account IDOR on encrypted secrets (read / update / delete / bulk delete) | Critical | Reproduced (A1, A2, A3) |
| C-2 | `changeMasterPassword` overwrites arbitrary secret IDs across accounts | Critical | Reproduced (A4) |
| H-1 | New-device approval can be bypassed via `completeDeviceLogin` / `addNewDeviceForUser` (no `approvedAt` check) | High | Reproduced (A5) |
| H-2 | Host-header poisoning of the master-device-reset confirmation link | High | Reproduced (A6) |
| H-3 | Autofill suffix match leaks credentials to lookalike domains (`endsWith` without dot boundary) + naive eTLD+1 | High | Reproduced (A9) |
| H-4 | Long-lived secrets in cleartext client storage: JWTs + raw AES vault key in `localStorage` / `browser.storage.local` | High | Confirmed statically |
| H-5 | `addDeviceSecret` stored plaintext server-side; DB read enrolls arbitrary devices | High | Confirmed statically |
| M-1 | GraphQL stack traces returned to any client (`maskedErrors: false` + explicit `stacktrace` extension) | Medium | Reproduced (A7) |
| M-2 | `webInputs` top-level query has no auth middleware (only unprotected top-level field) | Medium | Reproduced (A7) |
| M-3 | Email/user enumeration oracles on login, challenge, reset, and registration | Medium | Reproduced (A8) |
| M-4 | No effective rate limiting on auth endpoints; client IP is spoofable (`X-Forwarded-For`) | Medium | Confirmed statically |
| M-5 | Unbounded `vaultLockTimeoutSeconds` (near-immortal tokens) and zeroable `deviceRecoveryCooldownMinutes` (disables recovery delay) | Medium | Confirmed statically |
| M-6 | State-changing email confirmation over GET (prefetch/CSRF/log exposure) | Medium | Confirmed statically |
| M-7 | Stripe `subscription.deleted` handler deletes `userPaidProducts` by `productId` alone (cross-user scope) | Medium | Confirmed statically |
| M-8 | Dev-only behaviors gated on `NODE_ENV === 'development'` while shipped `.env` sets exactly that | Medium | Confirmed statically |
| L-1 | JWT `verify` without `algorithms` allowlist; `authenticated` oracle ignores revocation | Low | Confirmed statically |
| L-2 | Refresh tokens have no rotation/reuse detection; access+refresh both exposed to JS | Low | Confirmed statically |
| L-3 | Shared WebInput corpus is poisonable + `LIKE '%host'` suffix semantics widens matches | Low | Confirmed statically |
| L-4 | URL-less single-TOTP fallback fills on any site; `lastAutofilledValue` persists across sites | Low | Confirmed statically |

What is done well (keep): PBKDF2 600k / SHA-512 with 16-byte salt, AES-GCM with fresh 12-byte IV, `tokenVersion` revocation checked in middleware and oRPC context, `logoutAt` checks on refresh, SHA-256 hashing of reset confirmation tokens (plaintext never persisted), `LIKE` metacharacter escaping on `webInputs`, approval-policy check on the `approve` path, reset-request expiry + confirmed/completed/rejected guards.

---

## Critical

### C-1 — Cross-account IDOR on encrypted secrets
**Files:**
- `backend/models/UserMutation.ts:119-131` (`encryptedSecret` — `findFirst({ where: { id } })`, no `userId`)
- `backend/models/UserMutation.ts:153-170` (`removeEncryptedSecrets` — `where(inArray(id, secrets))`, no `userId`)
- `backend/models/EncryptedSecret.ts:27-60` (`update` / `delete` — `where(eq(id, this.id))`, no `userId`)

Any authenticated user who learns (or guesses) another user's secret UUID can read its ciphertext (`encryptedSecret`), overwrite it (`EncryptedSecretMutation.update`), or soft-delete it (`removeEncryptedSecrets`, `EncryptedSecretMutation.delete`). UUIDs are not a capability: they appear in sync payloads, logs, backups, and usage-event references.

**Reproduced:**
- A1: attacker `removeEncryptedSecrets([victimSecretId])` returned 1 row; victim row gained a `deletedAt` timestamp.
- A2: attacker `EncryptedSecretMutation.update` on a victim row changed `encrypted` to `pwned-by-attacker` and bumped `version` 1 → 2.
- A3: attacker `UserMutation.encryptedSecret(victimId)` returned the victim's `encrypted` blob.

The oRPC vault endpoints (`backend/orpc/router.ts:680-746`) do scope by `userId` and are not affected; the GraphQL paths above are.

**Fix:** scope every secret mutation/query by the caller: `and(eq(id, …), eq(userId, ctx.jwtPayload.userId))`, and return not-found instead of touching foreign rows. Add regression tests for cross-account read/update/delete/bulk-delete. Consider also scoping `SecretUsageEvent.secretId` writes to caller-owned secrets.

### C-2 — `changeMasterPassword` rewrites arbitrary secrets
**File:** `backend/models/UserMutation.ts:358-413`, loop at `395-404`:

```ts
for (const { id, ...patch } of input.secrets) {
  await tx.update(encryptedSecretSchema).set({ ...patch, … }).where(eq(encryptedSecretSchema.id, id))
}
```

The `secrets` array is fully client-controlled and never filtered by owner. An attacker on their own master device can overwrite any account's ciphertext (integrity destruction, targeted ransomware: replace victim blobs with attacker-encrypted blobs under a known key).

**Reproduced (A4):** attacker changed a victim secret's `encrypted` to `attacker-overwrite` via `changeMasterPassword`; count returned 1.

**Fix:** inside the transaction, verify all `input.secrets[].id` belong to `this.id` (e.g., select IDs first and reject on mismatch), and validate `decryptionChallengeId` belongs to the caller device (currently only matched on id+device+user for the timestamp update, but the secret writes are unscoped). Add a cross-account regression test.

## High

### H-1 — Device-approval bypass in `completeDeviceLogin` / `addNewDeviceForUser`
**Files:**
- `backend/models/DecryptionChallenge.ts:103-210` — `addNewDeviceForUser` checks only `userData.addDeviceSecret === currentAddDeviceSecret`; never checks `approvedAt` / `rejectedAt` / `blockIp`.
- `backend/orpc/router.ts:467-519` — `completeDeviceLogin` looks up the challenge by `id` only and completes it without checking approval state.

The intended gate for `REQUIRE_*_APPROVAL` policies is "master must approve before the client learns `addDeviceSecretEncrypted`". The completion endpoint does not enforce it: knowledge of the plaintext `addDeviceSecret` alone is sufficient. That secret is high-entropy (256-bit), so this is not remotely guessable — but it collapses the approval control to a single factor wherever the secret is exposed: phishing/reuse of the master password (which decrypts it), a DB read (H-5 stores it plaintext), or anyamnestic leak. Defense in depth demands the server re-check approval at completion time.

**Reproduced (A5):** with policy `REQUIRE_MASTER_DEVICE_APPROVAL`, created a `DecryptionChallengeForApproval` (pending, `approvedAt: undefined`), then called oRPC `auth.completeDeviceLogin` with the correct `currentAddDeviceSecret` and received a full authenticated session for the victim user — no approve call.

**Fix:** at the start of `addNewDeviceForUser` and oRPC `completeDeviceLogin`, require `challenge.approvedAt != null && challenge.rejectedAt == null && !challenge.blockIp`, and bind the challenge to the requesting `deviceInput.id`/`userId`. Return a generic login failure otherwise. Add a pending-challenge completion regression test.

### H-2 — Host-header poisoning of the reset confirmation link
**Files:**
- `backend/schemas/RootResolver.ts:131-146` (`getBackendOriginFromRequest` trusts `Host` / `X-Forwarded-Proto`)
- `backend/schemas/RootResolver.ts:714-727` (link built from that origin and emailed)
- `backend/app.ts:230-305` (GET confirmation endpoint)

**Reproduced (A6):** `initiateMasterDeviceReset` with `Host: evil-attacker.test` emailed:
`https://evil-attacker.test/confirm-master-device-reset?token=<uuid>`. A victim who clicks it hands the single-use confirmation token to the attacker. The attacker still needs the victim's master password to finish enrollment (recovery is correctly password-gated), but can force a master-device deletion cooldown / DoS, and with a phished password achieves full takeover.

**Fix:** build confirmation links from a server allowlist (`FRONTEND_URL` validated at startup), never from request headers. Consider signing the link and moving confirmation to POST. Log and alert on `Host`/`FRONTEND_URL` mismatches.

### H-3 — Autofill matches by raw suffix; lookalike domains receive credentials
**Files:**
- `web-extension/src/background/ExtensionDevice.ts:235-247`:
  `host.endsWith(domainAndTLD)` with no dot boundary.
- `shared/urlUtils.ts:1-14` (`getDomainNameAndTldFromUrl` takes the last two labels — wrong for multi-label public suffixes).
- Trigger: `web-extension/src/background/getContentScriptInitialState.ts:20-25`, auto-fill + auto-submit in `web-extension/src/content-script/autofill.ts:580-978` (notably `927-978`).

Consequences:
- `evil-example.com` and `notexample.com` both match a stored `example.com` credential (reproduced, A9: `vulnMatch=true`).
- `bank.co.uk` and `evil.co.uk` both reduce to `co.uk` (reproduced), so any `*.co.uk` host matches any stored `*.co.uk` credential.
- Fills are automatic on high-confidence login forms and page JS can read filled values without any submit; high-confidence forms are additionally auto-submitted. A user who visits a lookalike domain can silently disclose username, password, and (via the OTP path) TOTP codes.

**Fix:** match on eTLD+1 via a public-suffix list and require `host === domain || host.endsWith('.' + domain)`. Never auto-fill or auto-submit on a mere suffix; require exact eTLD+1 equality for silent fill and fall back to the click-to-fill picker otherwise. Add unit tests for `evil-example.com`, `notexample.com`, `example.com.evil.com`, `*.co.uk`.

### H-4 — Vault key and session tokens kept in cleartext persistent storage
- `vault-web/src/lib/accessToken.ts:1-25`, `vault-web/src/providers/VaultSessionProvider.tsx:105-107,300-335,552-564`: access token, refresh token, locked state, and — critically — the exported raw AES master key (`cryptoKeyToString(masterKey)`) plus session secrets persist in `window.localStorage` (`authier-vault-access-token`, `authier-vault-refresh-token`, `authier-vault-locked-state`, `authier-vault-unlocked-state`). Any XSS (or local malware/physical access) yields the vault key and both tokens with zero further cracking.
- `web-extension/src/background/ExtensionDevice.ts:106-137,155-161,204-215` + `loginSession.ts:548-579`: `masterEncryptionKey` (base64 raw key), plaintext `authSecret`, ciphertext secrets, email/salt persist in `browser.storage.local` (`backgroundState`, plus `currentAddDeviceSecret` / `addDeviceSecretEncrypted`).

**Fix:** keep the master key and access token in memory only (vault-web) / `chrome.storage.session` (extension); keep refresh in an `HttpOnly; Secure; SameSite=Strict; __Host-` cookie instead of JS-visible storage; encrypt any persisted cache with a device key from `crypto.subtle` non-extractable storage or drop persistence entirely in favor of re-login + re-derive. Set aggressive expiry and wipe on lock/logout.

### H-5 — `addDeviceSecret` stored plaintext on the server
**Files:** `backend/drizzle/schema.ts:384` (`user.addDeviceSecret`), written at `RootResolver.ts:244-256`, rotated in `DecryptionChallenge.ts:127-133`, compared at `DecryptionChallenge.ts:123-125`.

A read-only DB breach (backup, replica, SQLi elsewhere, insider) exposes the exact value `addNewDeviceForUser` compares. Combined with H-1, that is remote device enrollment without the master password, followed by ciphertext download and offline password guessing.

**Fix:** store only a salted slow hash (argon2id/bcrypt/scrypt) of `addDeviceSecret` and compare in constant time; keep the encrypted copy for the legitimate client flow. Rotate on use.

## Medium

### M-1 — Server stack traces sent to clients
**File:** `backend/app.ts:46-80` (`attachGraphqlStacks`), `67-72` (`maskedErrors: false`). Reproduced (A7): an unauthenticated `webInput(id:1)` error included `extensions.stacktrace` with absolute server paths (`backend/lib/authMiddleware.ts:23:11`, resolver internals). Aids targeted exploitation and confirms file layout/versions.

**Fix:** `maskedErrors: true` (or a custom masker), never attach stacks outside development, and log them server-side with a correlation ID.

### M-2 — `webInputs` reachable without authentication
**File:** `backend/schemas/RootResolver.ts:779-823` — the only top-level query/mutation without `@UseMiddleware(throwIfNotAuthenticated)`; body never touches `jwtPayload`. The type claims `IContextAuthenticated` but nothing enforces it. Reproduced (A7): direct resolver call with a ctx lacking `jwtPayload` returned the inserted `bank.example.com` row. (HTTP-level inline-args probing hit unrelated input-validation noise; the missing-middleware defect itself is unambiguous in code and the direct call.) By design this corpus is shared across users (see code comment), so the leak is selectors (`host/url/domPath/kind`), not ciphertext — still, it exposes which sites users visit and feeds H-3/L-3 poisoning.

**Fix:** add the auth middleware (or deliberately document and scope a public read, e.g., return only `host/kind` aggregates, rate-limit, and require auth for `url/domPath` detail).

### M-3 — Account enumeration oracles
- `deviceDecryptionChallenge` (`RootResolver.ts:350-354`): unknown email → `Login failed, check your email and master password`; known email (with master) → challenge object (reproduced A8).
- `registerNewUser` (`RootResolver.ts:283-290`): duplicate email → `User with such email already exists.` (reproduced A8).
- `initiateMasterDeviceReset` (`RootResolver.ts:609-613`): unknown email throws; known email returns `{requestedAt, processAt}`.
- `registerNewUser` device branch leaks whether a `deviceId` is taken.

**Fix:** return uniform responses (e.g., always behave as if a challenge/reset was created and send no distinguishing error), add per-IP rate limiting + CAPTCHA, and avoid logging emails (`RootResolver.ts:286`).

### M-4 — Auth endpoints effectively unthrottled; IP identity spoofable
- Only throttles found: per-user unverified-challenge cap (`>5/hour`, `RootResolver.ts:375-394`), per-(user,IP) `blockIp` (`363-373`), and a WebInput-delete limiter (`models/WebInput.ts:17-21`). An explicit `// TODO rate limit this per IP` sits on the login challenge (`RootResolver.ts:326`).
- Identity source `request.headers['x-forwarded-for'] ?? cf-connecting-ip ?? ''` (`app.ts:149-155`, `orpc/context.ts:28-31`, `createLegacyHttpAdapters.ts:50-64`) is client-controlled unless an edge strips it, defeating `blockIp`, per-IP accounting, GeoIP/push text, and audit trails.

**Fix:** derive IP from the socket / trusted-proxy config only; add a Redis-backed per-IP + per-account rate limiter with jittered uniform errors on all of register / challenge / complete / reset / refresh; alert on bursts.

### M-5 — Security-critical numbers unbounded
- `vaultLockTimeoutSeconds` (`shared/orpc/schemas.ts:89,122`, `models/Device.ts:202-217`): any nonnegative int → access `timeout/3`, refresh `timeout`. Setting `2^31-1` mints near-immortal tokens. **Fix:** clamp (e.g., 60s–30d) and re-issue on change.
- `deviceRecoveryCooldownMinutes` (`schemas.ts:85,150`): any nonnegative int including `0` → recovery delay disabled. **Fix:** enforce a minimum (e.g., ≥24h, or ≥16h to match registration default `16*60`) and require master-device auth + notification on change.

### M-6 — Email confirmation is a state-changing GET
**File:** `backend/app.ts:230-305` sets `confirmedAt` on GET. Link prefetchers/scanners can confirm without user intent; token sits in logs/proxies/Referers. Status strings (`missing-token/not-found/already-completed/rejected/expired/confirmed`) also form a token oracle (UUID space makes guessing infeasible, but the pattern is still wrong).

**Fix:** GET renders a confirmation page; a POST (with CSRF + expiry + single-use invalidation) performs the state change. Strip tokens from logs; use generic redirect statuses.

### M-7 — Stripe cancellation deletes across users
**File:** `backend/stripeWebhook.ts:140-143`: `delete(userPaidProducts).where(eq(productId))` — no `userId`. One user's `subscription.deleted` event can revoke every row sharing that `productId`. Limit adjustments keyed by `session.customer_details.email` are likewise fragile. Uncaught `constructEvent` throws also bubble to a generic 500 instead of a 400.

**Fix:** scope deletes/updates by `(userId, checkoutSessionId/customer)`, verify webhook signature with explicit error handling, and reconcile against Stripe API rather than trusting email/metadata alone.

### M-8 — Dev-gated destructive paths + dev `.env`
- `UserMutation.addCookie` (`models/UserMutation.ts:56-70`) mints a session as an arbitrary device when `NODE_ENV === 'development'`.
- `registerNewUser` (`RootResolver.ts:291-299`) **deletes** a colliding device row and retries when `NODE_ENV === 'development'`.
- Cookies use `secure: isProd` (`userAuth.ts:11-25,53-67`), so non-production serves them over HTTP.
- The working-tree `backend/.env` sets `NODE_ENV=development` alongside live keys. If that file ever backs a deployment, the dev paths and insecure cookies go live.

**Fix:** gate dev paths on an explicit non-default flag (e.g., `ENABLE_DEV_AUTH_BYPASS=1` + allowlisted admin), fail closed when `NODE_ENV` is unexpected, and keep live secrets out of `.env` files (secret manager / env injection; separate `.env.production` without dev values).

## Low / hardening

- **L-1 — JWT handling.** `sign`/`verify` never pin `algorithms` (`userAuth.ts:27-82`, `authMiddleware.ts:27`, `orpc/context.ts:111-117`, `app.ts:352,377`). `jsonwebtoken` defaults make `none`-forgery unlikely here, but pin `HS256` (or better, asymmetric `ES256` with key rotation), add `iat`/`iss`/`aud` checks, and fix `authenticated` (`RootResolver.ts:155-176`) to apply the same revocation checks as the middleware (device existence, `logoutAt`, `tokenVersion`) instead of signature-only.
- **L-2 — Token lifecycle.** `setNewRefreshToken` rotates the cookie value but old refresh tokens stay valid until expiry; no reuse detection. Both tokens are also returned in bodies and kept in JS storage (H-4). Add rotation with reuse detection (single-use refresh + token family), short access lifetimes, and bot
...[truncated 3074 chars]