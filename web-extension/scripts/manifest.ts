import fs from 'fs-extra'
import { getManifest } from '../manifest'
import { log, r } from './utils'

export async function writeManifest() {
  await fs.writeJSON(r('dist/manifest.json'), await getManifest(), {
    spaces: 2
  })
  log('PRE', 'write manifest.json')
}

writeManifest()
