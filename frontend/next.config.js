// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')
const path = require('path')

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  webpack: (config, _options) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader'
    })
    config.resolve.alias = {
      ...config.resolve.alias,
      '@emotion/react': path.resolve('./node_modules/@emotion/react'),
      '@emotion/core': path.resolve('./node_modules/@emotion/core'),
      react: path.resolve('./node_modules/react')
    }
    return config
  },
  swcMinify: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    externalDir: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js']
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
