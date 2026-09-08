import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/passkeys',
  testMatch: 'fullExtension.spec.ts',
  timeout: 60_000,
  workers: 1,
  reporter: 'line'
})
