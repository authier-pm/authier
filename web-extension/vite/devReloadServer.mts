import { WebSocketServer } from 'ws'
import { devReloadServerPort } from './extensionTargets.mts'

// an MV3 service worker is kept alive only while messages keep flowing, Chrome kills it after 30s idle
const heartbeatMs = 20_000
// several script bundles usually finish rebuilding after a single save
const debounceMs = 200

/**
 * Tells the background script of the dev extension when its scripts were last rebuilt.
 * The background reloads the whole extension whenever that is newer than its own start
 * (see src/background/devReloadClient.ts), which also covers restarts of the dev script.
 */
export function startDevReloadServer() {
  const server = new WebSocketServer({
    host: '127.0.0.1',
    port: devReloadServerPort
  })
  let builtAt = Date.now()
  let debounceTimer: NodeJS.Timeout | undefined

  const message = () => JSON.stringify({ builtAt })
  const broadcast = () => {
    for (const client of server.clients) {
      client.send(message())
    }
  }

  server.on('connection', (socket) => socket.send(message()))
  const heartbeat = setInterval(broadcast, heartbeatMs)

  return {
    notifyBuilt() {
      builtAt = Date.now()
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(broadcast, debounceMs)
    },
    close() {
      clearInterval(heartbeat)
      clearTimeout(debounceTimer)
      server.close()
    }
  }
}
