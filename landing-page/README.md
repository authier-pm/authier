# Authier landing page

Static Astro website for [authier.pm](https://www.authier.pm).

## Local development

From the repository root:

```sh
pnpm dev:landing
```

## Production build

```sh
pnpm build:landing
```

The static output is written to `landing-page/dist`. The site intentionally does
not use the Cloudflare Astro adapter because every route is pre-rendered at build
time.

## Cloudflare Pages

- Account: `fbd16d9252980833034caa69e11aa064`
- Project: `authier`
- Production branch: `main`
- Root directory: `landing-page`
- Build command: `pnpm build`
- Build output directory: `dist`

Both `authier.pm` and `www.authier.pm` should be attached to the Pages project,
with the apex domain redirecting permanently to the canonical `www` hostname.
