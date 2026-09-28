import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/verification-codes',
  timeout: 45_000,
  workers: 1,
  reporter: 'line'
})
