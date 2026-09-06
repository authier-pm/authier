# Security fixes: deployment and session behavior

This patch addresses C-1, C-2, and H-1 through H-5 from the security review.

- Secret reads, updates, deletes, bulk deletes, and usage events are scoped to the authenticated user. Master-password changes reject foreign/missing/duplicate secret IDs and invalid device challenges before changing any data.
- Device enrollment rechecks persisted approval, rejection, and IP blocking inside a transaction, binds the challenge to its user/device, and serializes enrollment-secret rotation across concurrent attempts.
- Reset email links use the configured `BACKEND_URL` origin (default `https://api.authier.pm`), never request headers. Configure this to the backend that serves `/confirm-master-device-reset`; local development may use an HTTP localhost origin.
- Autofill uses the public suffix list, including private suffixes, with a DNS label boundary. Lookalike domains and separate hosted tenants do not share credentials.
- Access tokens stay in memory or privileged extension `storage.session`; refresh tokens are renewed using an HttpOnly cookie. Plaintext JWTs and raw vault keys are never written to localStorage/browser.storage.local.
- Both clients remember unlocked vaults across browser sessions. The snapshot is AES-GCM encrypted in IndexedDB using a fresh non-exportable 256-bit Web Crypto key and IV. The browser stores the CryptoKey through structured cloning; the application never exports its raw bytes. Explicit lock/logout deletes the stored key and ciphertext. A generation check prevents an in-flight save from resurrecting a forgotten snapshot. Legacy plaintext snapshots and tokens are removed.
- The extension retains an allowlisted ciphertext-only fallback snapshot in local storage for explicit password unlocking. Generated-password history and active decrypted caches stay in privileged session storage and are cleared on lock/logout. The HttpOnly refresh cookie persists for the device's existing session lifetime; an expired cookie can be renewed automatically by proving possession of the remembered vault key through the existing approved-device login flow. Device revocation or a changed master password still requires fresh authentication.
- Remembered unlock intentionally permits the application to decrypt without user input after restart. This protects against simple localStorage/storage.local dumps, but same-origin injected code can invoke the device key. Web Crypto's non-exportable flag is not a guarantee of hardware/OS-keystore protection against a full browser-profile or machine compromise. Stronger isolation requires an OS-keystore/native integration or user-mediated hardware authentication.
- The web and extension clients generate enrollment secrets with cryptographic randomness. New server verifiers use PBKDF2-HMAC-SHA-256 with a random 128-bit salt and 600,000 iterations, checked in constant time. The server never stores the submitted plaintext enrollment secret.

## Database rollout

The generated migration is `backend/drizzle/migrations/20260906225610_dashing_mulholland_black/migration.sql`. It renames `User.addDeviceSecret` to `addDeviceSecretHash` and converts existing values to SHA-256 verifiers. Existing accounts remain usable; successful enrollment/password changes rotate to fresh secrets stored in the salted PBKDF2 format. There is no plaintext-verifier fallback.

Apply the migration manually as part of a coordinated backend deployment: the old backend expects the old column, while the new backend expects the renamed column. This patch does not run migrations against deployed databases. Migration compatibility is tested in PGlite.

These changes prevent the reported exploit paths. They cannot undo exposure of credentials or keys from an earlier compromise; previously exposed credentials need rotation.
