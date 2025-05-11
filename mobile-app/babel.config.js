module.exports = function (api) {
  api.cache(true)
  return {
    plugins: ['@lingui/babel-plugin-lingui-macro'],
    presets: ['babel-preset-expo']
  }
}
