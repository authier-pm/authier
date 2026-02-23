const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const config = {
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
    blockList: [
      /web-extension\/dist\/.*/,
      /backend\/dist\/.*/
    ],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'cjs', 'json', 'mjs']
  },
  watchFolders: [`${__dirname}/..`]
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
