const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
module.exports = merge(common, {
  devtool: 'eval',
  mode: 'production',
  // optimization: {
  //   minimize: false
  // minimizer: [new TerserPlugin()]
  // TODO whenever we try to minify, the output bundle cannot be parsed. We should investigate this and find out where the problem is. Happens with terser and without.
  // },
  optimization: {
    minimize: false,
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all',
      minChunks: 4,
      maxSize: 3500000
    }
  }
})
