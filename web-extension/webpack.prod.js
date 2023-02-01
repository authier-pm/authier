const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: 4,
      maxSize: 3500000
    }
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      API_URL:
        'https://jj46btrl5p42gvqobutebxifr40ogwdt.lambda-url.eu-central-1.on.aws/graphql'
    })
  ]
})
