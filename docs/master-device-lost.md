# Lost master device recovery

New users choose their recovery policy during extension, web-vault, or native Android signup. The default is one approval from another device and a 48-hour waiting period. Approval counts range from 0 to 10; waiting periods range from 5 minutes to 90 days (three months). Both conditions must be satisfied. Users who need recovery without another device must choose zero approvals in advance. The existing vault password remains necessary; this does not recover forgotten encryption keys.

The account's master device can change the policy in settings. `User.masterDeviceResetConfig` stores the validated JSON (`requiredApprovals`, `waitMinutes`, `notificationEmails`). The legacy cooldown field is kept in sync for older clients. Migration preserves existing accounts' email-only policy and clamps their existing wait to the supported bounds.

## Reset flow

1. Request a reset from the login approval screen.
2. Confirm the single-use link sent to the account email within 24 hours. The full waiting period starts at confirmation. Its expiry does not invalidate an already confirmed reset.
3. Other signed-in devices approve through Devices. Only devices registered before the request, excluding the lost master and requesting device, are eligible. Each counts once; logged-out or removed devices do not count at completion.
4. Any signed-in device can reject the request. The cron rechecks cancellation, the original master, the deadline and the approval quorum under row locks.
5. Once eligible, the old master device is deleted. Normal login with the vault password enrolls a new master. Ciphertext is retained.

Pending requests snapshot their policy and eligible devices. Later configuration changes do not alter them. Expired unconfirmed requests can be replaced. Completion is idempotent. Notifications for request, confirmation, approval, cancellation and completion go to the account email and all configured notification addresses (deduplicated). Additional addresses receive notifications, not the confirmation token.

## Cloudflare deployment

The existing `authier-api` Worker scheduled handler runs every minute via Cron Triggers; no separate workflow is needed. Completion occurs on the first successful run after all conditions are satisfied. Notifications are persisted in `MasterDeviceResetEmail`, delivered by the cron, and retried after failures. Delivery is at-least-once if a process dies after the email provider accepts a message.

Run `pnpm wrdeploy` from `backend`. It applies migrations before deploying and aborts on migration failure. Production Cloudflare Workers Builds must retain `pnpm run db:migrate && npx wrangler deploy`, with `DATABASE_URL` configured as a build secret. Preview uploads must not run production migrations. Runtime email delivery requires the existing Mailjet secrets and `DISABLE_EMAIL_SENDING=false`.

Validation: `pnpm --dir backend exec vitest run lib/masterDeviceReset.spec.ts`; UI captures: `pnpm --dir web-extension playwright:ui-preview masterDeviceRecovery.spec.ts`.
