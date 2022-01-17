const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: false // TODO when true, the output cannot be parsed. This can be checked using the
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      API_URL: 'http://api.authier.ml/graphql'
    })
  ]
})
