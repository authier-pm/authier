import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/passkeys',
  testMatch: 'passkeyBrowsers.spec.ts',
  workers: 1,
  timeout: 60000,
  reporter: 'list'
})
