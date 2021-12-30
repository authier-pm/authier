# authier

monorepo for authier FE and BE.

## Schema generation

```shell
yarn gbs #backend
yarn gfs # frontend/extension/mobile
```

or both at once

```shell
yarn schemas
```

## Getting started

`yarn` in the root, yarn workspaces should install all deps even in subfolders.

## Updating packages

keep in mind that a single package can be in multiple subfolders, so if you update it in one place, make sure to update it everywhere

## Yarn install

We are using yarn workspaces so always run yarn in root folder. That's where the lockfile is.

## How to run locally

Refer to readme inside each subproject for all the instructions. Generally you will need to run backend + whatever client you want to develop.
