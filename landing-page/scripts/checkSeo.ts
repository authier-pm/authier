import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distributionDirectory = join(projectDirectory, 'dist')

function listHtmlFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)

    if (statSync(path).isDirectory()) return listHtmlFiles(path)
    if (path.endsWith('.html')) return [path]

    return []
  })
}

function routeFromFile(path: string) {
  const relativePath = relative(distributionDirectory, path)

  if (relativePath === 'index.html') return '/'
  if (relativePath === '404.html') return '/404'

  return `/${relativePath.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`
}

function requireMatch(
  html: string,
  pattern: RegExp,
  label: string,
  route: string
) {
  const match = html.match(pattern)?.[1]?.trim()

  if (!match) {
    throw new Error(`${route}: missing ${label}`)
  }

  return match
}

if (!existsSync(distributionDirectory)) {
  throw new Error('Build output is missing. Run the production build first.')
}

const files = listHtmlFiles(distributionDirectory)
const routes = new Set(files.map(routeFromFile))
const titles = new Set<string>()
const descriptions = new Set<string>()
let internalLinks = 0
let structuredDataBlocks = 0

for (const file of files) {
  const route = routeFromFile(file)
  const html = readFileSync(file, 'utf8')
  const title = requireMatch(html, /<title>([^<]+)<\/title>/i, 'title', route)
  const description = requireMatch(
    html,
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    'meta description',
    route
  )
  const canonical = requireMatch(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"/i,
    'canonical URL',
    route
  )
  const h1Count = html.match(/<h1(?:\s|>)/gi)?.length ?? 0

  if (h1Count !== 1) {
    throw new Error(`${route}: expected exactly one h1, found ${h1Count}`)
  }

  if (title.length < 10 || title.length > 65) {
    throw new Error(
      `${route}: title length ${title.length} is outside 10–65 characters`
    )
  }

  if (
    route !== '/404' &&
    (description.length < 110 || description.length > 170)
  ) {
    throw new Error(
      `${route}: description length ${description.length} is outside 110–170 characters`
    )
  }

  if (!canonical.startsWith('https://www.authier.pm/')) {
    throw new Error(`${route}: canonical URL is outside the canonical origin`)
  }

  if (new URL(canonical).pathname !== route) {
    throw new Error(`${route}: canonical URL does not match the page route`)
  }

  if (route !== '/404') {
    if (titles.has(title)) throw new Error(`${route}: duplicate title ${title}`)
    if (descriptions.has(description)) {
      throw new Error(`${route}: duplicate meta description`)
    }
  }

  titles.add(title)
  descriptions.add(description)

  const jsonLdPattern =
    /<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis

  for (const match of html.matchAll(jsonLdPattern)) {
    JSON.parse(match[1] ?? '')
    structuredDataBlocks += 1
  }

  for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const href = match[1] ?? ''

    if (!href.startsWith('/')) continue

    const target = href.split(/[?#]/, 1)[0]?.replace(/\/$/, '') || '/'
    internalLinks += 1

    if (!routes.has(target)) {
      throw new Error(`${route}: internal link target does not exist: ${href}`)
    }
  }

  for (const match of html.matchAll(/<img\s[^>]*>/gi)) {
    if (!/\salt="[^"]*"/i.test(match[0])) {
      throw new Error(`${route}: image is missing alt text`)
    }
  }
}

for (const requiredFile of [
  'robots.txt',
  'sitemap-index.xml',
  'rss.xml',
  '_headers',
  '_redirects',
  '.well-known/security.txt'
]) {
  if (!existsSync(join(distributionDirectory, requiredFile))) {
    throw new Error(`Missing SEO or platform file: ${requiredFile}`)
  }
}

const sitemap = readFileSync(
  join(distributionDirectory, 'sitemap-0.xml'),
  'utf8'
)

for (const excludedRoute of ['/404', '/error']) {
  if (sitemap.includes(`<loc>https://www.authier.pm${excludedRoute}</loc>`)) {
    throw new Error(`Noindex route appears in the sitemap: ${excludedRoute}`)
  }
}

console.log(
  `SEO checks passed: ${files.length} HTML files, ${internalLinks} internal links, ${structuredDataBlocks} structured-data blocks.`
)
