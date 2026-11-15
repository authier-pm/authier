# Email sending

Authier sends verification, new device approval, account change and recovery emails from `Authier password manager <no-reply@authier.pm>` using the Worker's native `EMAIL` binding. See [Cloudflare Email Service](https://developers.cloudflare.com/email-service/get-started/send-emails/).

## Production setup

The Cloudflare account must use Workers Paid to send to arbitrary recipients. In Compute > Email Service > Email Sending, onboard `authier.pm` and wait for its DNS authentication records to be verified. Email Routing alone does not enable transactional sending to arbitrary users.

`backend/wrangler.toml` declares the `send_email` binding, restricts the sender to `no-reply@authier.pm`, and enables sending with `DISABLE_EMAIL_SENDING=false`. No recipient allowlist is configured because Authier sends verification and recovery emails to users. The binding is available in both HTTP requests and scheduled recovery processing; no email API token or Mailjet credentials are needed.

Deploy through `pnpm wrdeploy` from `backend` so pending migrations run first. Production Workers Builds must keep `pnpm run db:migrate && npx wrangler deploy`. Once the Cloudflare deployment is verified, the obsolete `MJ_APIKEY_PUBLIC` and `MJ_APIKEY_PRIVATE` secrets can be removed from the Worker, GitHub Actions and local environment files.

Cloudflare reports success when it accepts the message for delivery. New device approvals require a successful send outside tests. Failed reset confirmation sends roll back their database transaction. Queued recovery notifications remain pending and the cron retries them. It can send a duplicate if an invocation stops after Cloudflare accepts the email but before its database record is marked sent.

## Local development and tests

Sending is disabled unless `DISABLE_EMAIL_SENDING` is exactly `false`, and it is always disabled when `NODE_ENV=test`. Disabled messages are captured in the exported `sentEmails` array for assertions. `backend/.env.sample` keeps sending disabled.

The email binding has no `remote = true` setting, so `wrangler dev` uses [local email simulation](https://developers.cloudflare.com/email-service/observability/local-development/sending/) even when sending is enabled. Live development delivery requires explicitly enabling the remote email binding and setting `DISABLE_EMAIL_SENDING=false` with a non-test `NODE_ENV`. Use a controlled recipient for live checks.
