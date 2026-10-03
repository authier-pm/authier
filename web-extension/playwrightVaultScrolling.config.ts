import { defineConfig, devices } from '@playwright/test'
import previewConfig from './playwrightUiPreview.config'

export default defineConfig({
  ...previewConfig,
  testMatch: 'vaultScrolling.spec.ts',
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
})
