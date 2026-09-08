import { createServer } from 'vite'
import swc from 'unplugin-swc'

export const runBackendModule = async (path: string) => {
  // The generated GraphQL models contain circular decorator metadata. Use the
  // same Vite/SWC transformation as tests rather than native Bun/ts-node loading.
  const vite = await createServer({
    configFile: false,
    plugins: [swc.vite()],
    server: { middlewareMode: true },
    resolve: { tsconfigPaths: true },
    appType: 'custom'
  })
  await vite.ssrLoadModule(path)
  return vite
}
