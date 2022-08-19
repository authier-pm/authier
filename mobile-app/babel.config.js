module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  // reanimated must be listed last
  env: {
    production: {
      plugins: ['transform-remove-console']
    }
  },
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@shared': '../shared/',
          '@src': './src/',
          '@utils': './src/utils/',
          '@components': './src/components/',
          '@navigation': './src/navigation/',
          '@providers': './src/providers/'
        },
        extensions: ['.js', '.jsx', '.tsx', '.ts']
      }
    ],
    'macros',
    'react-native-reanimated/plugin'
  ]
}
