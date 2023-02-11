const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')

// special config for content script because we cannot use split chunks with it
module.exports = {
  mode: 'production',
  devtool: 'eval',
  optimization: {
    minimize: false
  },
  entry: {
    contentScript: path.join(__dirname, 'src/content-script/contentScript.ts')
  },
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash].chunk.js'
  },

  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
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
