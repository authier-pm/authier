const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
module.exports = merge(common, {
  devtool: 'source-map',
  mode: 'production',
  // optimization: {
  //   minimize: false
  // minimizer: [new TerserPlugin()]
  // TODO whenever we try to minify, the output bundle cannot be parsed. We should investigate this and find out where the problem is. Happens with terser and without.
  // },
  optimization: {
    minimizer: [new TerserPlugin()],
    runtimeChunk: false,
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'contentScript'
      },
      minChunks: 3,
      maxSize: 3500000
    }
  }
})
