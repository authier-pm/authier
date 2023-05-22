import fs from 'fs-extra'
import { resolve } from 'node:path'
import { getManifest } from '../src/manifest'

export const r = (...args: string[]) => resolve(__dirname, '..', ...args)
export async function writeManifest() {
  await fs.writeJSON(r('dist/manifest.json'), await getManifest(), {
    spaces: 2
  })
  console.log('PRE', 'write manifest.json')
}

writeManifest()
