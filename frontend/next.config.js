// @ts-check
const path = require('path')

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  webpack: (config, options) => {
    config.resolve.alias.react = path.resolve('./node_modules/react') // without this It was throwing "You might have more than one copy of React in the same app"

    return config
  },
  experimental: {
    externalDir: true
  }
}

module.exports = nextConfig
