const path = require('path')
const { makeMetroConfig } = require('@rnx-kit/metro-config')
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')

module.exports = makeMetroConfig({
  projectRoot: __dirname,
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'mjs'],
    resolveRequest: MetroSymlinksResolver()
  },
  watchFolders: [`${__dirname}/../..`, path.resolve(__dirname, '../shared/')]
})
