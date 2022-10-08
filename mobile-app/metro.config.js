const path = require('path')

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
    sourceExts: ['js', 'ts', 'tsx', 'mjs']
  },
  watchFolders: [`${__dirname}/..`]
}
