/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const resolveWorkspaceDependency = (id) => {
  try {
    return path.dirname(require.resolve(`${id}/package.json`))
  } catch {
    return path.resolve(__dirname, '..', 'node_modules', id)
  }
}

const resolveWorkspaceDependencyFile = (id) => {
  try {
    return require.resolve(id)
  } catch {
    return path.resolve(__dirname, '..', 'node_modules', id)
  }
}

const entries = {
  backgroundPage: path.join(__dirname, 'src/background/backgroundPage.ts'),
  popup: path.join(__dirname, 'src/index.tsx'),
  vault: path.join(__dirname, 'src/vault-index.tsx'),
  contentScript: path.join(__dirname, 'src/content-script/contentScript.ts')
}
require('dotenv/config')
console.log('API_URL:', process.env.API_URL)
const manifestVersion = Number(process.env.MANIFEST_VERSION ?? 3)
const mobileViewport =
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
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
          from: resolveWorkspaceDependencyFile(
            'webextension-polyfill/dist/browser-polyfill.js'
          ),
          to: path.join(__dirname, 'dist/js')
        }
      ]
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    new HtmlWebpackPlugin({
      scriptLoading: 'blocking',
      chunks: ['popup'],
      filename: 'popup.html',
      templateContent: `
    <html>
    <head>
      <title>Authier Extension - Popup</title>
      ${mobileViewport}
    </head>
      <body class="extension-popup">
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
      ${mobileViewport}
    </head>
      <body>
        <div id="vault"></div>
        <script type="application/javascript" src="browser-polyfill.js"></script>
      </body>
    </html>`
    }),
    ...(manifestVersion === 2
      ? [
          new HtmlWebpackPlugin({
            scriptLoading: 'blocking',
            chunks: ['backgroundPage'],
            filename: 'backgroundPage.html'
          })
        ]
      : []),

    // new ExtensionReloader(),
    new Dotenv({
      silent: false,
      systemvars: true
    })
    //new BundleAnalyzerPlugin()
  ],
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              target: 'es2022',
              jsx: 'automatic'
            }
          },
          {
            loader: 'babel-loader',
            options: {
              plugins: ['@emotion', 'macros']
            }
          }
        ]
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        exclude: /node_modules/,
        test: /src\/content-script.*\.tsx?$/,
        use: {
          loader: 'esbuild-loader',
          options: {
            target: 'es2015',
            jsx: 'automatic',
            jsxImportSource: 'preact'
          }
        }
      },

      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader']
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
      react: resolveWorkspaceDependency('react'),
      'react-dom': resolveWorkspaceDependency('react-dom'),
      '@emotion/react': resolveWorkspaceDependency('@emotion/react'),
      '@emotion/core': resolveWorkspaceDependency('@emotion/core'),
      '@src': path.resolve(__dirname, 'src/'),
      '@shared': path.resolve(__dirname, '../shared/'),
      '@util': path.resolve(__dirname, 'src/util/')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify'),
      process: require.resolve('process/browser')
    }
  }
}
