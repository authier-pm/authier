import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://www.authier.pm',
  integrations: [sitemap()],
  compressHTML: true,
  prefetch: true,
  trailingSlash: 'never'
})
