const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',
    minimize: false,
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
