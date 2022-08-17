const path = require('path')

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  // reanimated must be listed last
  env: {
    production: {
      plugins: ['transform-remove-console']
    }
  },
  plugins: ['macros', 'react-native-reanimated/plugin']
  // env: {
  //   test: {
  //     presets: ['@babel/preset-env']
  //   }
  // }
}
