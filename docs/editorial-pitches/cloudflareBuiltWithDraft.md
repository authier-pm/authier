# Cloudflare Small App Garden submission draft

Status: submitted through the official form on September 1, 2026. Cloudflare confirmed receipt with **Thanks for your submission! We'll review your app and get back to you soon.** No publication or backlink is claimed before independent acceptance and live-page verification.

Current route: [Small App Garden — Submit an App](https://garden.cloudflare.dev/submit/)

The current Small App Garden accepts public GitHub repositories for applications built on Cloudflare. Authier truthfully qualifies through its Cloudflare Worker API, Worker-hosted web vault, and Pages-hosted landing site. Ahrefs' official Website Authority Checker measured the exact `garden.cloudflare.dev` host at DR 53 on September 1, 2026.

## Exact staged fields

### GitHub Repository URL

`https://github.com/authier-pm/authier`

### Application URL

`https://www.authier.pm/`

### Contact Email

Leave blank. This field is optional, and no maintainer-controlled contact address is needed for the current submission.

### What makes this app special?

Authier is an early-stage AGPL password manager and TOTP vault for browsers and the web. Its API runs as an Elysia Cloudflare Worker with observability and a scheduled trigger; its Vite web vault runs as a Worker with static assets and SPA fallback. The app provides client-side encrypted sync, browser autofill, and trusted-device approval. The public project has not undergone an independent security audit.

The text is 409 characters, below the form's 500-character maximum.

## Publication and link evidence

- The Garden homepage and sampled application page are self-canonical and declare `index, follow`.
- The current [Localflare application page](https://garden.cloudflare.dev/localflare/) exposes direct external **View Project** and **GitHub** anchors with only `rel="noopener noreferrer"`; neither link is marked `nofollow`, `ugc`, or `sponsored`.
- The exact `garden.cloudflare.dev` host measured DR 53, two backlinks, and one linking website in Ahrefs' official checker, with both displayed followed percentages at 100%.
- Publication is editorially controlled by the Small App Garden. A submitted form is not a backlink, and no DR credit should be claimed unless Cloudflare publishes Authier and the live outbound link is verified.

## Evidence anchors

- Repository: https://github.com/authier-pm/authier
- Backend Worker configuration: https://github.com/authier-pm/authier/blob/main/backend/wrangler.toml
- Elysia Cloudflare Worker adapter: https://github.com/authier-pm/authier/blob/main/backend/worker.ts
- Web-vault Worker configuration: https://github.com/authier-pm/authier/blob/main/vault-web/wrangler.toml
- Landing-page Pages configuration: https://github.com/authier-pm/authier/blob/main/landing-page/wrangler.toml
- Canonical site: https://www.authier.pm/
- Web vault: https://vault.authier.pm/
- API: https://api.authier.pm/

## Guardrails

- Do not imply that Cloudflare endorses Authier or that publication is guaranteed.
- Do not claim measured scale, latency, reliability, security, or cost improvements without production data supplied by the maintainer.
- Do not disclose Cloudflare account identifiers, secrets, traffic volumes, customer data, or private infrastructure details.
- Preserve the early-stage and no-independent-audit disclosures.
- Recheck the published page, canonical, robots directives, and external-link relation before counting any backlink.

## Obsolete route retained for history

The former `https://workers.cloudflare.com/built-with/` showcase redirects to a Cloudflare 404, and the older Google **Built With Cloudflare Feature Submission Form** asks for an interview, contact details, and a licensing decision. It must not be used for this submission. The current Small App Garden form supersedes that route.
