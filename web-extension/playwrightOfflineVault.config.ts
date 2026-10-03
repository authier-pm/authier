import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/offline-vault',
  timeout: 45_000,
  workers: 1,
  use: { trace: 'retain-on-failure', actionTimeout: 8_000 },
  reporter: 'line'
})
