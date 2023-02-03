const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: false // TODO when true, the output cannot be parsed. This can be checked using the
  }
  // TODO: this is not working. breaks with error on init in popup
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     minChunks: 4,
  //     maxSize: 3500000
  //   }
  // },
})
