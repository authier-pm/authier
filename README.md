# authier

monorepo for authier password manager web extension, mobile app and backend.

If you are looking for the download links to use on your devices, use the official download page: https://www.authier.pm/download

## Running the extension build on Ubuntu

To build the browser extension make sure you run on node.js 18.15.0.
Please follow these commands:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm install --frozen-lockfile --prefer-offline
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
