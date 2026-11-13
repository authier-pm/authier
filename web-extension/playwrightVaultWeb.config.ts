import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/vault-web',
  outputDir: './test-results-vault-web',
  timeout: 30_000,
  workers: 1,
  reporter: 'line',
  webServer: {
    command:
      'pnpm --dir ../vault-web exec wrangler dev --local --ip 127.0.0.1 --port 4187',
    url: 'http://127.0.0.1:4187',
    timeout: 30_000
  }
})
