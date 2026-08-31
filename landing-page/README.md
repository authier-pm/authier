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

## Generate a product-update article

After product changes have landed and the working tree is clean, preview the Git
evidence that will be given to Codex:

```sh
pnpm article:new:dry
```

Generate the draft:

```sh
pnpm article:new
```

The command uses `codex exec` with read-only repository access. Codex examines
the commits and product files changed since the last successful article and
returns structured draft content. The deterministic wrapper creates one Astro
page under `src/pages/blog`, registers it in `src/data/blog.ts`, formats the
result, and runs the landing-page build and SEO checks. It does not commit, push,
or deploy anything.

Codex uses your configured default model and existing CLI login. Check the login
with `codex login status`, or override the model for one draft:

```sh
pnpm article:new --model <model-id>
```

The first run starts at the commit that introduced the generator. To cover an
earlier release window in that first article, pass `--since <git-ref>`. Later
runs use `article-generation/feature-update-state.json`; the same override can
recover from rewritten history. Review every product and security claim before
committing the draft.
