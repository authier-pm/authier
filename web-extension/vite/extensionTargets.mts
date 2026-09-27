import path from 'node:path'

export const extensionDir = path.resolve(import.meta.dirname, '..')
export const repositoryDir = path.resolve(extensionDir, '..')
export const distDir = path.join(extensionDir, 'dist')
export const outDir = path.join(distDir, 'js')

export const devServerPort = 5180
export const devServerOrigin = `http://127.0.0.1:${devServerPort}`
export const devReloadServerPort = 5181
export const devReloadServerUrl = `ws://127.0.0.1:${devReloadServerPort}`

export type ExtensionMode = 'development' | 'production'

export interface ExtensionPage {
  /** output `js/<name>.html`, also the id of the element React renders into */
  name: string
  title: string
  entry: string
  bodyClass?: string
}

/** HTML pages, bundled as ES modules and served by the dev server in dev mode */
export const extensionPages: ExtensionPage[] = [
  {
    name: 'popup',
    title: 'Authier Extension - Popup',
    entry: 'src/index.tsx',
    bodyClass: 'extension-popup'
  },
  {
    name: 'vault',
    title: 'Authier Extension - Vault',
    entry: 'src/vault-index.tsx'
  },
  {
    name: 'passkey',
    title: 'Authier - Passkey approval',
    entry: 'src/passkeys/passkeyIndex.tsx'
  }
]

export interface ExtensionScript {
  /** output `js/<name>.js` referenced from the manifest */
  name: string
  entry: string
}

/** background and content scripts, each bundled into a single classic (IIFE) script */
export const extensionScripts: ExtensionScript[] = [
  { name: 'backgroundPage', entry: 'src/background/backgroundPage.ts' },
  { name: 'contentScript', entry: 'src/content-script/contentScript.ts' },
  { name: 'passkeyPage', entry: 'src/passkeys/pageEntry.ts' },
  { name: 'passkeyBridge', entry: 'src/passkeys/bridgeEntry.ts' },
  { name: 'gmailCodes', entry: 'src/email-codes/gmailEntry.ts' }
]

const mobileViewport =
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />'

export function renderPageHtml(
  page: ExtensionPage,
  assets: { scripts: string[]; styles: string[] }
) {
  const bodyClass = page.bodyClass ? ` class="${page.bodyClass}"` : ''
  const styles = assets.styles.map(
    (href) => `    <link rel="stylesheet" href="${href}" />`
  )
  const scripts = assets.scripts.map(
    (src) => `    <script type="module" src="${src}"></script>`
  )

  return [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8" />',
    `    <title>${page.title}</title>`,
    `    ${mobileViewport}`,
    ...styles,
    '  </head>',
    `  <body${bodyClass}>`,
    `    <div id="${page.name}"></div>`,
    '    <script src="browser-polyfill.js"></script>',
    ...scripts,
    '  </body>',
    '</html>',
    ''
  ].join('\n')
}

/** in dev the pages load their modules from the Vite dev server, so React fast refresh works inside the extension */
export function renderDevPageHtml(page: ExtensionPage) {
  return renderPageHtml(page, {
    styles: [],
    scripts: [
      `${devServerOrigin}/@vite/client`,
      `${devServerOrigin}/@id/@vitejs/plugin-react/preamble`,
      `${devServerOrigin}/${page.entry}`
    ]
  })
}
