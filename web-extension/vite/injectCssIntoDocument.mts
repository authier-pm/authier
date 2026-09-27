import type { Plugin } from 'vite'

const injectedCssPrefix = '\0authier-injected-css:'
// must not end with .css, otherwise Vite's own CSS plugin would transform the injecting module
const injectedCssSuffix = '.inject.js'

/**
 * Content scripts are single classic scripts, so an extracted .css file would never be loaded.
 * Turns every `import './x.css'` into a module that appends the CSS as a <style> to the host document.
 */
export function injectCssIntoDocument(): Plugin {
  return {
    name: 'authier-inject-css-into-document',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith('.css') || !importer) return null

      const resolved = await this.resolve(source, importer, { skipSelf: true })
      return resolved
        ? `${injectedCssPrefix}${resolved.id}${injectedCssSuffix}`
        : null
    },
    load(id) {
      if (!id.startsWith(injectedCssPrefix)) return null

      const cssPath = id.slice(
        injectedCssPrefix.length,
        -injectedCssSuffix.length
      )
      const cssId = JSON.stringify(`${cssPath}?inline`)
      return [
        `import css from ${cssId};`,
        `const style = document.createElement('style');`,
        `style.textContent = css;`,
        `(document.head ?? document.documentElement).append(style);`
      ].join('\n')
    }
  }
}
