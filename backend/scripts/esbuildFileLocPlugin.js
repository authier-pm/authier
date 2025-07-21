'use strict'

const path = require('path')
const process = require('process')
const fs = require('fs')

const esbuildFileLocPlugin = (rootPath) => ({
  name: 'lambdaFileLocPlugin',
  setup(build) {
    build.onLoad(
      { filter: /.\.(js|ts|jsx|tsx)$/, namespace: 'file' },
      async (args) => {
        const isWindows = process.platform.startsWith('win')
        const esc = (p) => (isWindows ? p.replace(/\\/g, '/') : p)
        const pathInLambda = args.path
          .replace(process.cwd(), rootPath)
          .replace(path.dirname(process.cwd()), rootPath)
        const variables = `
        const __fileloc = {
          filename: "${esc(pathInLambda)}",
          dirname: "${esc(path.dirname(pathInLambda))}",
        };
        let __line = 0;
      `
        const fileContent = await fs.promises.readFile(args.path, 'utf8')

        const lines = fileContent.split('\n')
        let fileWithCharsAndLines = ''

        for (let i = 0; i < lines.length; i++) {
          const hasLineNumber = Boolean(lines[i].match(/__line/g))
          fileWithCharsAndLines += `${
            (hasLineNumber ? `__line=${i + 1};` : '') + lines[i]
          }\n`
        }

        const globalsRegex = /__(?=(filename|dirname))/g
        const contents = `${
          fileWithCharsAndLines.match(globalsRegex) ? variables : ''
        }\n${fileWithCharsAndLines.replace(globalsRegex, '__fileloc.')}`
        const loader = args.path.split('.').pop()

        return {
          contents,
          loader
        }
      }
    )
  }
})

module.exports = esbuildFileLocPlugin
