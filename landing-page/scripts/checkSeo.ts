import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distributionDirectory = join(projectDirectory, 'dist')
const publicContactEmail = 'authier.ml@gmail.com'
const obsoletePublicContactEmail = 'authier.ml@google.com'
const encryptionKeyUrl =
  'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xDE6887086F892325FEC04CC0D847525B6931381F'
const corpusFileName = 'autofill-safety-corpus-v1.json'
const corpusAssetPath = join(distributionDirectory, 'research', corpusFileName)
const corpusChecksumPath = join(
  distributionDirectory,
  'research',
  'autofill-safety-corpus-v1.sha256'
)

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateDatasetMetadata(value: unknown, route: string) {
  if (Array.isArray(value)) {
    for (const item of value) validateDatasetMetadata(item, route)
    return
  }

  if (!isRecord(value)) return

  const schemaType = value['@type']
  const isDataset =
    schemaType === 'Dataset' ||
    (Array.isArray(schemaType) && schemaType.includes('Dataset'))

  if (isDataset) {
    if (typeof value.license !== 'string' || value.license.length === 0) {
      throw new Error(`${route}: Dataset structured data is missing a license`)
    }

    if (!isRecord(value.creator) || typeof value.creator.name !== 'string') {
      throw new Error(`${route}: Dataset structured data is missing a creator`)
    }
  }

  for (const nestedValue of Object.values(value)) {
    validateDatasetMetadata(nestedValue, route)
  }
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

  if (html.includes(obsoletePublicContactEmail)) {
    throw new Error(`${route}: contains the obsolete project contact address`)
  }

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
    const structuredData: unknown = JSON.parse(match[1] ?? '')
    validateDatasetMetadata(structuredData, route)
    structuredDataBlocks += 1
  }

  for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const href = match[1] ?? ''

    if (!href.startsWith('/')) continue

    const target = href.split(/[?#]/, 1)[0]?.replace(/\/$/, '') || '/'
    internalLinks += 1

    const assetPath = join(distributionDirectory, target.slice(1))

    if (!routes.has(target) && !existsSync(assetPath)) {
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

const securityContact = readFileSync(
  join(distributionDirectory, '.well-known/security.txt'),
  'utf8'
)

if (!securityContact.includes(`Contact: mailto:${publicContactEmail}`)) {
  throw new Error('security.txt is missing the canonical project email contact')
}

if (!securityContact.includes(`Encryption: ${encryptionKeyUrl}`)) {
  throw new Error('security.txt is missing the working public encryption key')
}

if (securityContact.includes(obsoletePublicContactEmail)) {
  throw new Error('security.txt contains the obsolete project contact address')
}

const corpusContents = readFileSync(corpusAssetPath)
const corpusSha256 = createHash('sha256').update(corpusContents).digest('hex')
const checksumContents = readFileSync(corpusChecksumPath, 'utf8')
const expectedChecksumContents = `${corpusSha256}  ${corpusFileName}\n`

JSON.parse(corpusContents.toString('utf8'))

if (checksumContents !== expectedChecksumContents) {
  throw new Error('Autofill corpus SHA-256 sidecar is stale or malformed')
}

const corpusPage = readFileSync(
  join(distributionDirectory, 'research', 'autofill-safety-corpus.html'),
  'utf8'
)

if (!corpusPage.includes(corpusSha256)) {
  throw new Error('Autofill corpus page does not publish the current SHA-256')
}

if (!corpusPage.includes('href="/research/autofill-safety-corpus-v1.sha256"')) {
  throw new Error('Autofill corpus page does not link its SHA-256 sidecar')
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
