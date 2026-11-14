import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { buildApp } from './app'
import { processPendingMasterDeviceResets } from './lib/processPendingMasterDeviceResets'
import { purgeExpiredRelayedCodes } from './lib/relayedVerificationCodes'
import { withDatabase, type DatabaseBindings } from './prisma/prismaClient'
import { withEmailSending, type EmailBindings } from './utils/email'

type WorkerBindings = DatabaseBindings & EmailBindings

const workerApp = buildApp(
  new Elysia({
    adapter: CloudflareAdapter
  })
).compile()

export default {
  fetch: (request: Request, env: WorkerBindings) =>
    withEmailSending(env, () =>
      withDatabase(env, () => workerApp.fetch(request))
    ),
  scheduled: (_event: unknown, env: WorkerBindings) =>
    withEmailSending(env, () =>
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
    )
}
