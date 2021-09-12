// @ts-check
const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs')

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  webpack: (config, _options) => {
    config.resolve.alias.react = path.resolve('./node_modules/react') // without this It was throwing "You might have more than one copy of React in the same app"

    return config
  },
  experimental: {
    externalDir: true
  }
}
const SentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
// @ts-expect-error
module.exports = withSentryConfig(nextConfig, SentryWebpackPluginOptions)
