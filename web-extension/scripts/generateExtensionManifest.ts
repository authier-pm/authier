import fs from 'fs-extra'
import { resolve } from 'node:path'
import { getManifest } from '../src/manifest'

export const dir = (...args: string[]) => resolve(__dirname, '..', ...args)
export async function generateExtensionManifest() {
  const manifest = await getManifest()

  await fs.writeJSON(dir('dist/manifest.json'), manifest, {
    spaces: 2
  })
  console.log(`written manifest.json with version ${manifest.version}`)
}

generateExtensionManifest()
