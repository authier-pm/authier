import fs from 'fs-extra'
import { execSync } from 'child_process'
import type PkgType from '../package.json'
import { dir } from './generateExtensionManifest'

async function pushNewTag() {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType
  const { version } = pkg
  const tagName = `v${version}-extension`

  execSync(`git commit -m "Release version ${version}"`)
  execSync(`git tag -a ${tagName} -m "version ${version}"`)
  execSync('git push origin')
  execSync(`git push origin ${tagName}`)

  console.log(`Successfully created and pushed tag ${tagName}`)
}

pushNewTag()
