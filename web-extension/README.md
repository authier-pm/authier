[![PR's Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

## Running the extension build on Ubuntu

To build the browser extension please follow these commands:

```
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm install
cd web-extension
cp .env.example .env
pnpm prodBuild
```

## Getting started with development

Install pnpm globally: https://pnpm.io/installation
and follow the instructions just instead `pnpm prodBuild` run `pnpm dev`

**Scripts**

- `pnpm dev` - run `webpack` in `watch` mode
- `pnpm build` - builds the production-ready unpacked extension
- `pnpm test -u` - runs Jest + updates test snapshots
- `pnpm lint` - runs EsLint

## Publishing a new version to stores

We have all of the stores automated on CI except firefox. Firefox is handled manually from a separate branch where we still have extension manifest V2

To publish a new version to Firefox extension store invoke: `pnpm release:firefox`

The extension gets published and the xpi file is available in the `web-extension/web-ext-artifacts` directory.
No need to upload the xpi file to the stores, that is already done.

<details>
  <summary>Loading the extension in Google Chrome</summary>

In [Google Chrome](https://www.google.com/chrome/), open up [chrome://extensions](chrome://extensions) in a new tab. Make sure the `Developer Mode` checkbox in the upper-right corner is turned on. Click `Load unpacked` and select the `dist` directory in this repository - your extension should now be loaded.

![Installed Extension in Google Chrome](https://i.imgur.com/ORuHbDR.png 'Installed Extension in Google Chrome')

</details>

<details>
  <summary>Loading the extension in Brave</summary>

In [Brave](https://brave.com/), open up [brave://extensions](brave://extensions) in a new tab. Make sure the `Developer Mode` checkbox in the upper-right corner is turned on. Click `Load unpacked` and select the `dist` directory in this repository - your extension should now be loaded.

![Installed Extension in Brave](https://i.imgur.com/z8lW02m.png 'Installed Extension in Brave')

</details>

<details>
  <summary>Loading the extension in Mozilla Firefox</summary>

In [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/), open up the [about:debugging](about:debugging) page in a new tab. Click the `Load Temporary Add-on...` button and select the `manfiest.json` from the `dist` directory in this repository - your extension should now be loaded.

![Installed Extension in Mozilla Firefox](https://i.imgur.com/gO2Lrb5.png 'Installed Extension in Mozilla Firefox')

</details>

**Notes**

- Includes ESLint configured to work with TypeScript and Prettier.

- Includes tests with Jest - note that the `babel.config.js` and associated dependencies are only necessary for Jest to work with TypeScript.

- Recommended to use `Visual Studio Code` with the `Format on Save` setting turned on.

- Example icons courtesy of [FontAwesome](https://fontawesome.com).

- [Microsoft Edge]() is not currently supported.

- Includes Storybook configured to work with React + TypeScript. Note that it maintains its own `webpack.config.js` and `tsconfig.json` files. See example story in `src/components/hello/__tests__/hello.stories.tsx`

**Built with**

- [React](https://reactjs.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io)
- [Eslint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Webpack](https://webpack.js.org/)
- [Babel](https://babeljs.io/)
- [Chakra-ui](https://chakra-ui.com/)

**Misc. References**

- [Chrome Extension Developer Guide](https://developer.chrome.com/extensions/devguide)
- [Firefox Extension Developer Guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)
- [Eslint + Prettier + Typescript Guide](https://dev.to/robertcoopercode/using-eslint-and-prettier-in-a-typescript-project-53jb)

## Two modes

- strict: you never have your codes on another device other than your primary phone. One code only is sent to the device from your phone after every biometric verification.
- lax: your codes are decrypted on your devices too. You can choose a timeout to lock the vault. When unlocked, all the OTP codes are filled effortlessly without the need for your primary phone.

## Check output in dist

since it is common to bump into a dependency which breaks webpack silently, it's best to check at least parsing on the webpack output. We can do this by `pnpm checkBuildOutput`
