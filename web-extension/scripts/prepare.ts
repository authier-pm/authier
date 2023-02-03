// generate stub index.html files for dev entry
import { execSync } from 'child_process'
import fs from 'fs-extra'
import chokidar from 'chokidar'
import { isDev, log, port, r } from './utils'

/**
 * Stub index.html to use Vite in development
 */
async function stubIndexHtml() {
  const views = ['popup', 'vault']

  for (const view of views) {
    let data = await fs.readFile(r(`dist/${view}.html`), 'utf-8')
    data = data
      .replace('"./main.ts"', `"http://localhost:${port}/${view}/main.ts"`)
      .replace(
        '<div id="app"></div>',
        '<div id="app">Vite server did not start</div>'
      )
    await fs.writeFile(r(`dist/${view}.html`), data, 'utf-8')
    log('PRE', `stub ${view}`)
  }
}

function writeManifest() {
  execSync('ts-node ./scripts/manifest.ts', { stdio: 'inherit' })
}

writeManifest()

if (isDev) {
  stubIndexHtml()
  chokidar.watch(r('dist*.html')).on('change', () => {
    stubIndexHtml()
  })
  chokidar.watch([r('manifest.ts'), r('package.json')]).on('change', () => {
    writeManifest()
  })
}
