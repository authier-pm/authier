import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { buildApp } from './app'
import { processPendingMasterDeviceResets } from './lib/processPendingMasterDeviceResets'
import { purgeExpiredRelayedCodes } from './lib/relayedVerificationCodes'
import { withDatabase, type DatabaseBindings } from './prisma/prismaClient'

const workerApp = buildApp(
  new Elysia({
    adapter: CloudflareAdapter
  })
).compile()

export default {
  fetch: (request: Request, env: DatabaseBindings) =>
    withDatabase(env, () => workerApp.fetch(request)),
  scheduled: (_event: unknown, env: DatabaseBindings) =>
    withDatabase(env, async () => {
      const [resets, expiredRelayedCodes] = await Promise.all([
        processPendingMasterDeviceResets(),
        purgeExpiredRelayedCodes()
      ])
      console.log('master device reset cron', resets)
      console.log(
        'expired relayed verification codes deleted',
        expiredRelayedCodes
      )
    })
}
