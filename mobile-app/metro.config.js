const { makeMetroConfig } = require('@rnx-kit/metro-config')
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')

const path = require('path')

module.exports = makeMetroConfig({
  projectRoot: __dirname,
  resolver: {
    resolveRequest: MetroSymlinksResolver(),
    sourceExts: ['js', 'ts', 'tsx', 'mjs']
  },
  watchFolders: [`${__dirname}/..`, path.resolve(__dirname, '../shared/')]
})
