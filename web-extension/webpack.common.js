const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    backgroundPage: path.join(__dirname, 'src/background/backgroundPage.ts'),
    popup: path.join(__dirname, 'src/index.tsx'),
    vault: path.join(__dirname, 'src/vault-index.tsx'),
    contentScript: path.join(__dirname, 'src/content-script/contentScript.ts')
  },
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].js'
  },

  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.EnvironmentPlugin({
      API_URL: 'http://localhost:5051/graphql'
      // API_URL: 'https://api.authier.ml/graphql'
    })
  ],
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      },
      {
        exclude: /node_modules/,
        test: /src\/content-script.*\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.join(__dirname, 'src/content-script/tsconfig.json')
          }
        }
      },
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['macros']
          }
        }
      },

      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@src': path.resolve(__dirname, 'src/')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify')
    }
  }
}
