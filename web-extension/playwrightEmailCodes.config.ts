import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/email-codes',
  timeout: 45_000,
  workers: 1,
  reporter: 'line'
})
