const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    usedExports: true,
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',
    minimizer: [new TerserPlugin()],
    runtimeChunk: false,
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'contentScript' && chunk.name !== 'backgroundPage'
      },
      minChunks: 2,
      maxSize: 3500000
    }
  }
})
