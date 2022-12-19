const exclusionList = require('metro-config/src/defaults/exclusionList')
const { makeMetroConfig } = require('@rnx-kit/metro-config')
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')

module.exports = makeMetroConfig({
  projectRoot: __dirname,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  },
  resolver: {
    resolveRequest: MetroSymlinksResolver(),
    blacklistRE: exclusionList([
      /web-extension\/dist\/.*/,
      /backend\/dist\/.*/
    ]),
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'cjs', 'json', 'mjs']
  },
  watchFolders: [`${__dirname}/..`]
})
