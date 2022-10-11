const path = require('path')
const exclusionList = require('metro-config/src/defaults/exclusionList')

module.exports = {
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
    blacklistRE: exclusionList([/dist\/.*/]),
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'cjs', 'json', 'mjs']
  },
  watchFolders: [`${__dirname}/..`]
}
