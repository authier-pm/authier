import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build, createServer } from 'vite'
import { startDevReloadServer } from '../vite/devReloadServer.mts'
import { prepareExtensionDist } from '../vite/extensionDist.mts'
import {
  devServerOrigin,
  distDir,
  extensionPages,
  extensionScripts,
  outDir,
  renderDevPageHtml,
  type ExtensionScript
} from '../vite/extensionTargets.mts'
import {
  createPagesConfig,
  createScriptConfig
} from '../vite/extensionViteConfig.mts'

const mode = 'development'
let reloadServer: ReturnType<typeof startDevReloadServer> | undefined

/** resolves after the first build, keeps rebuilding the script on every change */
async function watchScript(script: ExtensionScript) {
  const watcher = await build(createScriptConfig(script, mode, { watch: true }))
  if (!('on' in watcher)) {
    throw new Error(`Expected a watcher for ${script.name}`)
  }

  return new Promise<typeof watcher>((resolve) => {
    watcher.on('event', (event) => {
      if (event.code === 'BUNDLE_END') {
        console.log(`built ${script.name}.js in ${event.duration}ms`)
        reloadServer?.notifyBuilt()
        resolve(watcher)
      }
      // the error itself is printed by Vite, keep watching so that the next save can fix it
      if (event.code === 'ERROR') {
        resolve(watcher)
      }
    })
  })
}

await prepareExtensionDist({ devServerOrigin })

const pagesServer = await createServer(createPagesConfig(mode))
await pagesServer.listen()
await Promise.all(
  extensionPages.map((page) =>
    writeFile(path.join(outDir, `${page.name}.html`), renderDevPageHtml(page))
  )
)

const scriptWatchers = await Promise.all(extensionScripts.map(watchScript))
reloadServer = startDevReloadServer()

pagesServer.printUrls()
console.log(
  `\nLoad ${distDir} as an unpacked extension (Firefox: pick manifest.json in about:debugging).` +
    '\nPopup, vault and passkey pages hot reload, the extension reloads itself when background or content scripts change.\n'
)

process.once('SIGINT', async () => {
  reloadServer?.close()
  await Promise.all([
    pagesServer.close(),
    ...scriptWatchers.map((watcher) => watcher.close())
  ])
  process.exit(0)
})
