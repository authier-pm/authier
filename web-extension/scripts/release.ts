import fs from 'fs-extra'
import { exec } from 'child_process'
import type PkgType from '../package.json'
import { dir } from './generateExtensionManifest'

async function pushNewTag() {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType
  const { version } = pkg

  const tagName = `v${version}-extension`
  exec(
    `git commit -m "Release version ${version}" && git tag -a ${tagName} -m "version ${version}" && git push origin`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to commit, create, or push git tag: ${error}`)
        return
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`)
        return
      }
      console.log(stdout)
    }
  )
}

pushNewTag()
