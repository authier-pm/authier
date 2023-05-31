module.exports = {
  presets: ['@rnx-kit/babel-preset-metro-react-native'],
  // reanimated must be listed last
  env: {
    production: {
      plugins: ['transform-remove-console']
    },
    test: {
      plugins: [['module:react-native-dotenv', { path: './.env' }]]
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
    'module:react-native-dotenv',
    'macros',
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes']
      }
    ]
  ]
}
