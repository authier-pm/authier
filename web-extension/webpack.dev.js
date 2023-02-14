const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const path = require('path')
module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map'
})
