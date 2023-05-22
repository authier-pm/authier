import fs from 'fs-extra'
import { exec } from 'child_process'

async function pushNewTag() {
  fs.readFile('package.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to open package.json:', err)
      return
    }

    const json = JSON.parse(data)
    const version = json.version

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
  })
}

pushNewTag()
