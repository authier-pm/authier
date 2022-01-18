const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const ExtensionReloader = require('webpack-extension-reloader')
const path = require('path')
module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map'

  // plugins: [ // TODO fix
  //   new ExtensionReloader({
  //     manifest: path.resolve(__dirname, './dist/manifest.json')
  //   })
  // ]
})
