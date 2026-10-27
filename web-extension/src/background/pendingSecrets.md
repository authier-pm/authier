# Durable new-item saves

`DeviceState.addSecrets` encrypts each new login, TOTP or passkey and writes an
explicit ciphertext-only record to `storage.local` before reporting success.
Each record has a client-generated item UUID and operation UUID. These IDs and
the encrypted envelope, including its IV, remain unchanged on retries to the
existing `/api/v1/vault/create` endpoint. No database migration is needed.

One storage key per item prevents concurrent windows from overwriting each
other's pending saves. The queue is independent of cached vault snapshots, so a
stale snapshot cannot discard a pending item. Acknowledgements are validated and
cached before removing the corresponding queue entry. Crashes between the server
commit and removal are handled by the server's durable operation idempotency.

Web Locks serialize queue drains across extension contexts. Saves and uploads
hold shared vault-write locks; password changes hold the exclusive lock through
the server response and local key replacement. Saving another item therefore
does not wait for a network upload. A background alarm retries every minute while
unlocked; initialization, new saves and manual synchronization also retry.

The queue is scoped to the account and a local-only fingerprint of its encryption
key. Device re-enrollment with the same key can resume pending saves. Locking or
switching accounts invalidates in-flight responses. Logout leaves the encrypted
queue intact and removes ordinary unlocked state. An account token is checked
again before upload. Editing or deleting pending items and changing the master
password are blocked until synchronization completes.

The vault and popup show pending saves, unsupported item types and pending items
encrypted with an earlier password. Such earlier-key entries are retained but
never uploaded under the new key. A password changed on another device can
require recovery using the previous password; this change does not add a recovery
UI. Clearing extension data or uninstalling the extension removes local-only
saves. Server quota and authorization failures retain pending ciphertext.

Read schemas accept future nonempty kind strings. Extension and web decoders
only interpret positively recognized kinds; unknown records remain in encrypted
state and never become TOTP or autofill candidates. Android's generated read DTOs
likewise preserve strings, while write enums remain closed. Master-password
rotation in this extension blocks on unknown kinds instead of omitting them.
Previously released clients still need upgrading before a new server item kind
is enabled.

Regression coverage includes actual encryption, storage failure, stale snapshots,
re-login, lock/account changes, acknowledgement loss, and real generated Android
HTTP decoding. `tests/offline-vault/pendingSaves.spec.ts` uses the built extension,
real browser storage and Web Locks, and restarts Chromium before retrying the
same operation. All backend tests use PGlite.
