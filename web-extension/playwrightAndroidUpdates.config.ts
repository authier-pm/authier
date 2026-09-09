import { defineConfig } from '@playwright/test'
import previewConfig from './playwrightUiPreview.config'

export default defineConfig(previewConfig, {
  testMatch: 'androidUpdates.spec.ts',
  testIgnore: [],
  webServer: [
    {
      command: 'pnpm preview:ui',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'pnpm --dir ../landing-page dev',
      env: { ASTRO_DEV_BACKGROUND: '1' },
      url: 'http://127.0.0.1:4321/download',
      reuseExistingServer: !process.env.CI
    }
  ]
})
