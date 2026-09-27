import { build } from 'vite'
import { prepareExtensionDist } from '../vite/extensionDist.mts'
import {
  extensionScripts,
  type ExtensionMode
} from '../vite/extensionTargets.mts'
import {
  createPagesConfig,
  createScriptConfig
} from '../vite/extensionViteConfig.mts'

const mode: ExtensionMode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development'

await prepareExtensionDist({})
await Promise.all([
  build(createPagesConfig(mode)),
  ...extensionScripts.map((script) => build(createScriptConfig(script, mode)))
])
