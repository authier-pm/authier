const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const path = require('path')
module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.EnvironmentPlugin({
      API_URL: 'http://localhost:5051/graphql',
      PAGE_URL: 'https://www.authier.pm'
    })
  ]
})
