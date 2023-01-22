/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const ExtensionReloader = require('webpack-ext-reloader')

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
    new ExtensionReloader(),
    new webpack.EnvironmentPlugin({
      /* // API_URL: */
      /* //   'https://jj46btrl5p42gvqobutebxifr40ogwdt.lambda-url.eu-central-1.on.aws/graphql', */
      /* API_URL: 'http://localhost:5051/graphql', */
      /* PAGE_URL: 'http://localhost:5450' */
      /* // API_URL: 'https://api.authier.ml/graphql' */
    }),
    new Dotenv()
  ],
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     minChunks: 4,
  //     maxSize: 3500000
  //   }
  // },
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
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@emotion', 'macros']
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
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      react: path.resolve('../node_modules/react'),
      '@emotion/react': path.resolve('../node_modules/@emotion/react'),
      '@emotion/core': path.resolve('../node_modules/@emotion/core'),
      '@src': path.resolve(__dirname, 'src/'),
      '@shared': path.resolve(__dirname, '../shared/'),
      '@util': path.resolve(__dirname, 'src/util/')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify')
    }
  }
}
