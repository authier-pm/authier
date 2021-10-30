/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path')
const extraNodeModules = {
  shared: path.resolve(__dirname + '/../shared')
}
const watchFolders = [path.resolve(__dirname + '/../shared')]

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true
      }
    })
  },
  resolver: {
    extraNodeModules
  },
  watchFolders
}
