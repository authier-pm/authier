import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
  manifestVersion,
  writeExtensionManifest,
  type ManifestOptions
} from '../src/manifest.ts'
import { outDir } from './extensionTargets.mts'

const require = createRequire(import.meta.url)

/** cleans dist/js and writes the files which are not produced by any bundle */
export async function prepareExtensionDist(manifestOptions: ManifestOptions) {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  // always written, so that a dev manifest allowing the dev server can never end up in a release build
  await writeExtensionManifest(manifestOptions)
  await copyFile(
    require.resolve('webextension-polyfill/dist/browser-polyfill.js'),
    path.join(outDir, 'browser-polyfill.js')
  )

  if (manifestVersion === 2) {
    // Firefox MV2 runs the background script in a persistent page instead of a service worker
    await writeFile(
      path.join(outDir, 'backgroundPage.html'),
      '<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <script src="backgroundPage.js"></script>\n  </head>\n</html>\n'
    )
  }
}
