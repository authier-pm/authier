import fs from 'fs/promises'
import { resolve } from 'node:path'
import { getManifest } from '../src/manifest'

export const dir = (...args: string[]) => resolve(__dirname, '..', ...args)
export async function generateExtensionManifest() {
  const manifest = await getManifest()

  await fs.writeFile(
    dir('dist/manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  console.log(`written manifest.json with version ${manifest.version}`)
}

generateExtensionManifest()
