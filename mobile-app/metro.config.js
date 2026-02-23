const path = require('path')
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const reactPath = path.dirname(require.resolve('react/package.json', { paths: [__dirname] }))
const reactNativePath = path.dirname(
  require.resolve('react-native/package.json', { paths: [__dirname] })
)
const apolloClientPath = path.dirname(
  require.resolve('@apollo/client/package.json', { paths: [__dirname] })
)

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
    extraNodeModules: {
      react: reactPath,
      'react-native': reactNativePath,
      '@apollo/client': apolloClientPath,
      // Apollo 3.14+ uses `rehackt`; alias it to the same React instance to avoid duplicate Reacts.
      rehackt: reactPath
    },
    blockList: [
      /web-extension\/dist\/.*/,
      /backend\/dist\/.*/
    ],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'cjs', 'json', 'mjs']
  },
  watchFolders: [`${__dirname}/..`]
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
