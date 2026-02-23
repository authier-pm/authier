import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { buildApp } from './app'

const workerApp = buildApp(
  new Elysia({
    adapter: CloudflareAdapter
  })
).compile()

export default workerApp
