import fs from 'fs-extra'
import { exec } from 'child_process'
import type PkgType from '../package.json'
import { dir } from '../scripts/updateManifestVersion'

async function pushNewTag() {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType
  const version = pkg.version

  exec(
    `git tag -a v${version} -m "version ${version}" && git push origin v${version}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to create or push git tag: ${error}`)
        return
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`)
        return
      }
      console.log(`Git tag created: v${version}`)
    }
  )
}

pushNewTag()
