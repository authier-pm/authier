# Android vault encryption interoperability

The Kotlin implementation in `android-app/app/src/main/java/dev/authier/android/crypto/AuthierCrypto.kt`
uses the same encryption format as `shared/cryptoUtils.ts` and the legacy React Native client.
The backend stores opaque encrypted strings; JSON over HTTP does not change the encrypted bytes.

## Key and payload format

| Field          | Contract                                                                             |
| -------------- | ------------------------------------------------------------------------------------ |
| Password bytes | UTF-8, with no trimming, case folding, or Unicode normalization                      |
| Account salt   | 16 cryptographically random bytes; standard padded Base64 in `encryptionSalt`        |
| KDF            | PBKDF2 with HMAC-SHA-512, 600,000 iterations                                         |
| Derived key    | 32 bytes / AES-256                                                                   |
| Encryption     | AES-GCM, 12 random IV bytes per encryption, 16-byte authentication tag, no AAD       |
| Plaintext      | UTF-8 string: a JSON object for a vault item, opaque string for an enrollment secret |
| Wire envelope  | Standard padded Base64 of `salt[16]                                                  |     | iv[12] |     | ciphertext |     | tag[16]` |

The envelope can contain empty plaintext, so its minimum decoded length is 44 bytes.
`Cipher.doFinal()` already appends or consumes the GCM tag. Do not append another tag.
The platform provides [PBKDF2WithHmacSHA512 from Android API 26](https://developer.android.com/reference/javax/crypto/SecretKeyFactory).
All password derivation and encryption must run off the main thread.

Derive the master key using the **account's `encryptionSalt` returned by the approved login challenge**,
never the account email or an individual item's salt prefix. The existing salt prefix is unauthenticated
metadata: it is not GCM additional authenticated data, and clients ignore it during decryption. Changing
this behavior would require a versioned cryptographic migration. Android rejects truncated envelopes,
invalid/canonicality-violating Base64, invalid key sizes, malformed UTF-8 plaintext, and failed GCM tags.
It rejects malformed UTF-16 password surrogate sequences rather than allowing platform-specific replacement.
Ordinary Unicode passwords, including supplementary characters and combining marks, are supported byte for byte.

## Registration, device approval, and unlocking

1. Registration generates the account salt once and derives the master key locally.
2. Generate a random 32-byte enrollment secret and encrypt its Base64 string under the master key.
   Send `addDeviceSecret`, `addDeviceSecretEncrypted`, and `encryptionSalt` in registration. The server
   accepts an opaque secret; Android does not need to imitate the web client's base-36 formatting.
3. Login requests a challenge using email and a persistent device identity. Only an approved challenge
   reveals `encryptionSalt` and `addDeviceSecretEncrypted`.
4. Derive the key, then decrypt that **fresh challenge's** encrypted secret to obtain
   `currentAddDeviceSecret`. A failed tag means the password or encrypted data is wrong.
5. Generate another enrollment secret, encrypt it with the **same key and account salt**, and submit the
   old plaintext as proof plus the new plaintext/encrypted pair to complete device login.
6. Save the new encrypted secret as a local unlock verifier. It can still verify the master password
   offline after another device logs in and rotates the account enrollment secret.

The enrollment secret is **account-wide** and rotates during successful login; the master key and account
salt do not rotate. Cached plaintext enrollment secrets must never be reused as server login proof.
Concurrent login completions can invalidate a challenge's secret; request a fresh challenge to retry.
An offline unlock only decrypts local state. Reauthentication still requires server approval.
Keep passwords and decrypted keys in memory only while unlocked. Token/cache persistence belongs in
Android Keystore-protected storage, not this shared-format crypto utility.

The legacy password-change flow re-encrypts every vault item and enrollment secret with the new password,
retaining the account salt. A future password-change operation must commit the complete re-encryption
atomically, invalidate other sessions, and account for offline edits. Changing only the password-derived
enrollment secret makes existing vault items unreadable. Android must not expose partial password rotation.

## Compatibility fixtures and tests

`shared/cryptoTestVectors.json` is the single fixture read by Bun and Kotlin tests. It contains public,
deterministic examples with ASCII and Unicode passwords, composed/decomposed Unicode, empty plaintext,
JSON, newlines, and NUL. It includes raw derived keys so differences in KDF, text encoding, and envelopes
are independently observable. These are test values, never production credentials or production IVs.

```sh
bun shared/generateCryptoTestVectors.ts
bun test shared/cryptoUtils.spec.ts
cd android-app
./gradlew :app:testDebugUnitTest --tests 'dev.authier.android.crypto.*'
```

Fixture regeneration uses the existing TypeScript implementation and WebCrypto. Review changes to the
fixtures as protocol changes; do not regenerate them merely to make a failing implementation pass.
Kotlin's encryption output is compared byte for byte against each fixture, and both implementations
verify decryption. Negative tests cover IV/ciphertext/tag tampering and wrong keys; production paths
are checked for fresh IVs and enrollment secrets.

## TOTP

`Totp.generate` uses [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html), with HMAC-SHA-1 by default,
optional SHA-256/SHA-512, 6–8 digits, and a positive period in seconds. Its `now` argument uses milliseconds
to match JavaScript `Date.now()`. The existing vault payload omits algorithm, so absent algorithm means
SHA-1. Base32 accepts lowercase, whitespace, hyphens, and padding as existing clients do.

Counter calculation floors epoch seconds before dividing by the period. The previous short-secret
TypeScript fallback rounded seconds, which advanced codes up to 500 ms early; both implementations now use RFC behavior.
Tests cover every RFC 6238 Appendix B vector, timestamps beyond 32-bit Unix time, legacy short keys,
formatting, and the exact window boundary.
