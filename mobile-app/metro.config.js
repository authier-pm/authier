/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path')

const exclusionList = require('metro-config/src/defaults/exclusionList')
const {
  getMetroTools,
  getMetroAndroidAssetsResolutionFix
} = require('react-native-monorepo-tools')

const monorepoMetroTools = getMetroTools()

const androidAssetsResolutionFix = getMetroAndroidAssetsResolutionFix()

module.exports = {
  transformer: {
    // Apply the Android assets resolution fix to the public path...
    publicPath: androidAssetsResolutionFix.publicPath,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  },
  resolver: {
    sourceExts: ['js', 'ts', 'tsx', 'mjs'],
    // Ensure we resolve nohoist libraries from this directory.
    blockList: exclusionList(monorepoMetroTools.blockList),
    extraNodeModules: monorepoMetroTools.extraNodeModules
  },
  // Add additional Yarn workspace package roots to the module map.
  // This allows importing from all the project's packages.
  watchFolders: [
    ...monorepoMetroTools.watchFolders,
    path.resolve(__dirname, '../shared')
  ]
}
