/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const entries = {
  backgroundPage: path.join(__dirname, 'src/background/backgroundPage.ts'),
  popup: path.join(__dirname, 'src/index.tsx'),
  vault: path.join(__dirname, 'src/vault-index.tsx')
}

if (process.env.AUTHIER_ENV === 'dev') {
  entries.contentScript = path.join(
    __dirname,
    'src/content-script/contentScript.ts'
  )
}

module.exports = {
  entry: entries,
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash].chunk.js'
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(
            __dirname,
            '../node_modules/webextension-polyfill/dist/browser-polyfill.js'
          ),
          to: path.join(__dirname, 'dist/js')
        }
      ]
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new HtmlWebpackPlugin({
      scriptLoading: 'blocking',
      chunks: ['popup'],
      filename: 'popup.html',
      templateContent: `
    <html>
    <head>
      <title>Authier Extension - Popup</title>
    </head>
      <body>
        <div id="popup"></div>
        <script type="application/javascript" src="browser-polyfill.js"></script>
      </body>
    </html>`
    }),
    new HtmlWebpackPlugin({
      scriptLoading: 'blocking',
      chunks: ['vault'],
      filename: 'vault.html',
      templateContent: `
    <html>
    <head>
      <title>Authier Extension - Vault</title>
    </head>
      <body>
        <div id="vault"></div>
        <script type="application/javascript" src="browser-polyfill.js"></script>
      </body>
    </html>`
    }),
    // new ExtensionReloader(),
    new Dotenv()
    //new BundleAnalyzerPlugin()
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
