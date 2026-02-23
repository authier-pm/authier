import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { buildApp } from './app'
import { processPendingMasterDeviceResets } from './lib/processPendingMasterDeviceResets'

const workerApp = buildApp(
  new Elysia({
    adapter: CloudflareAdapter
  })
).compile()

export default {
  fetch: workerApp.fetch,
  scheduled: async () => {
    const result = await processPendingMasterDeviceResets()
    console.log('master device reset cron', result)
  }
}
