import fs from 'fs-extra'
import { resolve } from 'node:path'
import { getManifest } from '../src/manifest'
import child_process from 'child_process'

export const dir = (...args: string[]) => resolve(__dirname, '..', ...args)
export async function updateManifestVersion() {
  const manifest = await getManifest()

  await fs.writeJSON(dir('dist/manifest.json'), manifest, {
    spaces: 2
  })
  console.log(`written manifest.json for version ${manifest.version}`)

  child_process.execSync(`git add *`)
  child_process.execSync(
    `git commit -m "bump web extension to ${manifest.version}"`
  )
}

updateManifestVersion()
