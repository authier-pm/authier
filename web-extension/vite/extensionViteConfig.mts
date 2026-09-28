import path from 'node:path'
import react from '@vitejs/plugin-react'
import {
  loadEnv,
  mergeConfig,
  type InlineConfig,
  type Plugin,
  type Rolldown
} from 'vite'
import {
  devReloadServerUrl,
  devServerOrigin,
  devServerPort,
  extensionDir,
  extensionPages,
  outDir,
  renderPageHtml,
  repositoryDir,
  type ExtensionMode,
  type ExtensionScript
} from './extensionTargets.mts'
import { injectCssIntoDocument } from './injectCssIntoDocument.mts'
import { linguiBabelTransform } from './linguiBabelTransform.mts'

const defineValue = (value: string | undefined) =>
  value === undefined ? 'undefined' : JSON.stringify(value)

function createSharedConfig(mode: ExtensionMode): InlineConfig {
  // like dotenv-webpack with systemvars: .env files overridden by the process environment
  const env = loadEnv(mode, extensionDir, '')

  return {
    configFile: false,
    root: extensionDir,
    mode,
    publicDir: false,
    clearScreen: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.API_URL': defineValue(env.API_URL),
      'process.env.PAGE_URL': defineValue(env.PAGE_URL)
    },
    resolve: {
      alias: [
        // generate-password imports node's crypto just for randomBytes
        {
          find: /^crypto$/,
          replacement: path.join(extensionDir, 'src/lib/cryptoBrowser.ts')
        },
        { find: '@src', replacement: path.join(extensionDir, 'src') },
        { find: '@util', replacement: path.join(extensionDir, 'src/util') },
        { find: '@shared', replacement: path.join(repositoryDir, 'shared') }
      ],
      dedupe: ['react', 'react-dom', '@emotion/react']
    },
    plugins: [linguiBabelTransform()],
    build: {
      outDir,
      emptyOutDir: false,
      target: 'es2022',
      minify: mode === 'production',
      reportCompressedSize: false
    }
  }
}

function collectImportedCss(
  chunk: Rolldown.OutputChunk,
  bundle: Rolldown.OutputBundle,
  collected = new Set<string>()
) {
  for (const css of chunk.viteMetadata?.importedCss ?? []) {
    collected.add(css)
  }
  for (const imported of chunk.imports) {
    const importedChunk = bundle[imported]
    if (importedChunk?.type === 'chunk') {
      collectImportedCss(importedChunk, bundle, collected)
    }
  }
  return collected
}

/** writes js/<page>.html for every bundled page entry, linking its CSS */
function extensionPagesHtml(): Plugin {
  return {
    name: 'authier-extension-pages-html',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const page of extensionPages) {
        const entry = Object.values(bundle).find(
          (output): output is Rolldown.OutputChunk =>
            output.type === 'chunk' &&
            output.isEntry &&
            output.name === page.name
        )
        if (!entry) {
          throw new Error(`Missing entry chunk for page ${page.name}`)
        }

        this.emitFile({
          type: 'asset',
          fileName: `${page.name}.html`,
          source: renderPageHtml(page, {
            scripts: [entry.fileName],
            styles: [...collectImportedCss(entry, bundle)]
          })
        })
      }
    }
  }
}

/** popup, vault and passkey pages. Used both for `vite build` and for the HMR dev server */
export function createPagesConfig(mode: ExtensionMode): InlineConfig {
  const pageEntries = extensionPages.map((page) => page.entry)

  return mergeConfig(createSharedConfig(mode), {
    base: './',
    plugins: [react(), extensionPagesHtml()],
    optimizeDeps: {
      entries: pageEntries
    },
    server: {
      host: '127.0.0.1',
      port: devServerPort,
      strictPort: true,
      // the pages are opened from the extension origin, so assets must point back to the dev server
      origin: devServerOrigin,
      cors: {
        origin: [/^chrome-extension:\/\//, /^moz-extension:\/\//]
      },
      fs: {
        allow: [repositoryDir]
      }
    },
    build: {
      sourcemap: mode === 'development',
      rolldownOptions: {
        input: Object.fromEntries(
          extensionPages.map((page) => [
            page.name,
            path.join(extensionDir, page.entry)
          ])
        ),
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    }
  } satisfies InlineConfig)
}

/**
 * Background and content scripts cannot load ES module chunks,
 * so each one is bundled separately into a self-contained IIFE.
 */
export function createScriptConfig(
  script: ExtensionScript,
  mode: ExtensionMode,
  options: { watch: boolean } = { watch: false }
): InlineConfig {
  return mergeConfig(createSharedConfig(mode), {
    // the rebuild output of the five watchers is summarized by scripts/devExtension.mts
    logLevel: options.watch ? 'warn' : 'info',
    define: {
      'process.env.AUTHIER_DEV_RELOAD_URL': defineValue(
        options.watch ? devReloadServerUrl : undefined
      )
    },
    plugins: [injectCssIntoDocument()],
    build: {
      // inline, because content scripts cannot fetch source maps from the extension
      sourcemap: mode === 'development' ? 'inline' : false,
      watch: options.watch ? {} : null,
      rolldownOptions: {
        input: path.join(extensionDir, script.entry),
        output: {
          format: 'iife',
          entryFileNames: `${script.name}.js`,
          codeSplitting: false
        }
      }
    }
  } satisfies InlineConfig)
}
