# authier

monorepo for authier FE and BE.

## Running the extension build on Ubuntu

To build the browser extension please follow these commands:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm i zx -g #needed for a postinstall script in mobile-app
pnpm install
cd web-extension
cp .env.example .env
pnpm prodBuild
```

## Schema generation

```shell
pnpm gbs #backend
pnpm gfs # frontend/extension/mobile
```

or both at once

```shell
pnpm schemas
```

## Getting started

`pnpm i` in the root, pnpm workspaces should install all deps even in subfolders.

## Updating packages

keep in mind that a single package can be in multiple subfolders, so if you update it in one place, make sure to update it everywhere

## Pnpm install

We are using pnpm workspaces so always run pnpm in root folder. That's where the lockfile is.

## How to run locally

Refer to readme inside each subproject for all the instructions. Generally you will need to run backend + whatever client you want to develop.

## Contrib locs

For now we're running it manually every week or so by `pnpm contrib`. If we ever see a profit from this project, it will be divided each month proportionally according to the latest numbers in `contrib-locs.json`
