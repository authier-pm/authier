[![PR's Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

## Running the extension build on Ubuntu

To build the browser extension, follow these commands from the repository root:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm install
cd web-extension
cp .env.example .env
pnpm prodBuild
```

## Getting started with development

Install pnpm globally: https://pnpm.io/installation

From the repository root, install workspace dependencies, then work inside `web-extension`:

```bash
pnpm install
cd web-extension
cp .env.example .env
pnpm dev
```

**Scripts** (from `web-extension/package.json`)

- `pnpm dev` — run webpack in watch mode (`webpack.dev.js`)
- `pnpm devBuild` — one-shot development webpack build
- `pnpm prodBuild` — production-ready unpacked extension into `dist/`
- `pnpm test` — run Vitest once
- `pnpm test:watch` — Vitest in watch mode
- `pnpm test:ui` — Vitest UI
- `pnpm tsc` — TypeScript check
- `pnpm checkBuildOutput` — sanity-check webpack output parsing
- `pnpm generateManifest` — regenerate the extension manifest

From the repository root, `pnpm fmt:check web-extension/README.md` checks formatting.

## Publishing a new version to stores

Chrome, Edge, and Firefox publishing is automated on CI. Run `pnpm release` (from `web-extension`, or `pnpm release` at the repo root which delegates here) to create and push a new extension tag; CI builds Manifest V3 for Chrome and Edge and Manifest V2 for Firefox before submitting each bundle to its store.

To build the Firefox Manifest V2 extension locally:

```bash
MANIFEST_VERSION=2 pnpm generateManifest && MANIFEST_VERSION=2 pnpm prodBuild
```

Official install links (source of truth): [authier.pm/download](https://www.authier.pm/download) — Google Chrome, Mozilla Firefox (desktop and Firefox for Android), and Microsoft Edge. Authier ships as a browser extension only; there is no native desktop or mobile app download.

<details>
<summary>Loading the extension in Google Chrome</summary>

In [Google Chrome](https://www.google.com/chrome/), open [chrome://extensions](chrome://extensions) in a new tab. Turn on **Developer mode**, click **Load unpacked**, and select the `web-extension/dist` directory — your extension should now be loaded.

![Installed Extension in Google Chrome](https://i.imgur.com/ORuHbDR.png "Installed Extension in Google Chrome")

</details>

<details>
<summary>Loading the extension in Microsoft Edge</summary>

In [Microsoft Edge](https://www.microsoft.com/edge), open [edge://extensions](edge://extensions) in a new tab. Turn on **Developer mode**, click **Load unpacked**, and select the `web-extension/dist` directory.

</details>

<details>
<summary>Loading the extension in Brave</summary>

In [Brave](https://brave.com/), open [brave://extensions](brave://extensions) in a new tab. Turn on **Developer mode**, click **Load unpacked**, and select the `web-extension/dist` directory.

![Installed Extension in Brave](https://i.imgur.com/z8lW02m.png "Installed Extension in Brave")

</details>

<details>
<summary>Loading the extension in Mozilla Firefox</summary>

In [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/), open [about:debugging](about:debugging) in a new tab. Click **Load Temporary Add-on...** and select the `manifest.json` from the `web-extension/dist` directory — your extension should now be loaded.

For a Firefox-oriented local build, use the Manifest V2 commands above before loading `dist`.

![Installed Extension in Mozilla Firefox](https://i.imgur.com/gO2Lrb5.png "Installed Extension in Mozilla Firefox")

</details>

**Notes**

- TypeScript is checked with `pnpm tsc`. Formatting is handled at the monorepo root (`pnpm fmt` / `pnpm fmt:check`).
- Unit tests use Vitest (`pnpm test`), not Jest.
- Recommended: Visual Studio Code with Format on Save.
- Example icons courtesy of [FontAwesome](https://fontawesome.com).

**Built with**

- [React](https://reactjs.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/)
- [Webpack](https://webpack.js.org/)
- [Chakra UI](https://chakra-ui.com/)

**Misc. References**

- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions)
- [Firefox Extension Developer Guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)

## Two modes

- **strict:** you never have your codes on another device other than your primary phone. One code only is sent to the device from your phone after every biometric verification.
- **lax:** your codes are decrypted on your devices too. You can choose a timeout to lock the vault. When unlocked, all the OTP codes are filled effortlessly without the need for your primary phone.

## Check output in dist

Since it is common to bump into a dependency which breaks webpack silently, check parsing on the webpack output:

```bash
pnpm checkBuildOutput
```
