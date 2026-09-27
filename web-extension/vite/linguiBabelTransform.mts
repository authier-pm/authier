import { transformAsync } from '@babel/core'
import type { Plugin } from 'vite'

/**
 * Runs @lingui/babel-plugin-lingui-macro on .ts/.tsx files.
 * Needed because @vitejs/plugin-react v6+ uses oxc instead of babel,
 * so the babel plugins option is no longer supported.
 */
export function linguiBabelTransform(): Plugin {
  return {
    name: 'lingui-babel-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || /node_modules/.test(id)) return null
      if (
        !code.includes('@lingui/core/macro') &&
        !code.includes('@lingui/react/macro')
      )
        return null

      const result = await transformAsync(code, {
        filename: id,
        plugins: ['@lingui/babel-plugin-lingui-macro'],
        parserOpts: {
          plugins: ['typescript', 'jsx']
        },
        sourceType: 'module',
        // Ignore babel.config.js to avoid @babel/preset-env converting ESM to CJS
        configFile: false,
        babelrc: false,
        sourceMaps: true
      })
      if (!result?.code) return null
      // serialized, because babel types its source map arrays as readonly while rolldown does not
      return {
        code: result.code,
        map: result.map ? JSON.stringify(result.map) : null
      }
    }
  }
}
