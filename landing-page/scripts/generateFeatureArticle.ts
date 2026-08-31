import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

interface FeatureUpdateState {
  version: 1
  lastCoveredCommit: string | null
  lastCoveredAt: string | null
  lastArticlePath: string | null
}

interface GenerationResult {
  status: 'generated' | 'no_publishable_changes'
  slug: string
  title: string
  description: string
  readingTime: string
  summary: string
  articleBody: string
  coveredFeatures: string[]
  excludedChanges: string[]
}

const scriptPath = fileURLToPath(import.meta.url)
const scriptsDirectory = dirname(scriptPath)
const landingPageDirectory = resolve(scriptsDirectory, '..')
const repositoryDirectory = resolve(landingPageDirectory, '..')
const generationDirectory = join(landingPageDirectory, 'article-generation')
const statePath = join(generationDirectory, 'feature-update-state.json')
const promptPath = join(generationDirectory, 'feature-update-prompt.md')
const resultSchemaPath = join(
  generationDirectory,
  'feature-update-result.schema.json'
)
const blogDataPath = 'landing-page/src/data/blog.ts'
const scriptRelativePath = normalizePath(
  relative(repositoryDirectory, scriptPath)
)
const productPaths = [
  'backend',
  'mobile-app',
  'shared',
  'vault-web',
  'web-extension'
] as const
const allowedArticleTags = new Set([
  'a',
  'blockquote',
  'div',
  'h2',
  'h3',
  'li',
  'ol',
  'p',
  'strong',
  'ul'
])

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    model: { type: 'string' },
    since: { type: 'string' },
    through: { type: 'string', default: 'HEAD' }
  },
  strict: true
})

if (values.help) {
  printHelp()
  process.exit(0)
}

if (!values['dry-run']) requireCleanWorkingTree()

const state = readState()
const baselineRef =
  values.since ?? state.lastCoveredCommit ?? findInitialBaseline()
const throughRef = values.through ?? 'HEAD'
const baselineCommit = resolveCommit(baselineRef, 'baseline')
const throughCommit = resolveCommit(throughRef, 'ending')
const headCommit = resolveCommit('HEAD', 'HEAD')

if (!values['dry-run'] && throughCommit !== headCommit) {
  throw new Error(
    'Article generation must end at HEAD so Codex inspects the same code represented by the Git range. Use --through only with --dry-run.'
  )
}

requireAncestor(baselineCommit, throughCommit)

const range = `${baselineCommit}..${throughCommit}`
const evidence = collectEvidence(range)

printEvidenceSummary(baselineCommit, throughCommit, evidence)

if (values['dry-run']) {
  console.log(
    '\nDry run complete. Codex was not invoked and no files were changed.'
  )
  process.exit(0)
}

if (evidence.changedFiles.length === 0) {
  console.log(
    '\nNo committed product changes were found. No article was generated.'
  )
  process.exit(0)
}

if (evidence.commitCount > 250) {
  throw new Error(
    `The range contains ${evidence.commitCount} product commits. Use --since <git-ref> to choose a narrower editorial range.`
  )
}

const prompt = buildPrompt(baselineCommit, throughCommit, evidence)
const resultPath = getResultPath()

rmSync(resultPath, { force: true })
runCodex(prompt, resultPath)

if (!existsSync(resultPath)) {
  throw new Error('Codex completed without writing its structured result.')
}

const result = parseGenerationResult(readFileSync(resultPath, 'utf8'))
rmSync(resultPath, { force: true })

if (result.status === 'no_publishable_changes') {
  const changedPaths = listWorkingTreeChanges()

  if (changedPaths.length > 0) {
    throw new Error(
      `Codex reported no publishable changes but edited: ${changedPaths.join(', ')}`
    )
  }

  console.log(
    '\nCodex found no publishable user-facing changes. No files were changed.'
  )
  process.exit(0)
}

const articlePath = validateGenerationResult(result)

if (listWorkingTreeChanges().length > 0) {
  throw new Error(
    'Codex changed the working tree despite its read-only sandbox.'
  )
}

writeGeneratedDraft(result, articlePath)
validateDraftChanges(articlePath)
formatAndValidate(articlePath)

const nextState: FeatureUpdateState = {
  version: 1,
  lastCoveredCommit: throughCommit,
  lastCoveredAt: git(['show', '-s', '--format=%cI', throughCommit]),
  lastArticlePath: articlePath
}

writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`)

console.log(`\nDraft generated: ${articlePath}`)
console.log(`Title: ${result.title}`)
console.log(`Summary: ${result.summary}`)
console.log(`Covered through: ${throughCommit}`)
printResultList('Covered features', result.coveredFeatures)
printResultList('Excluded changes', result.excludedChanges)
console.log('The draft and updated baseline are uncommitted for human review.')

function normalizePath(path: string) {
  return path.replaceAll('\\', '/')
}

function capture(command: string, args: readonly string[]) {
  const result = spawnSync(command, args, {
    cwd: repositoryDirectory,
    encoding: 'utf8'
  })

  if (result.error) throw result.error

  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim()
    throw new Error(`${command} ${args.join(' ')} failed.\n${detail}`)
  }

  return result.stdout.trim()
}

function runVisible(command: string, args: readonly string[], input?: string) {
  const result = spawnSync(command, args, {
    cwd: repositoryDirectory,
    input,
    stdio: ['pipe', 'inherit', 'inherit']
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed.`)
  }
}

function git(args: readonly string[]) {
  return capture('git', args)
}

function printHelp() {
  console.log(`Generate a reviewable Authier product-update article from Git history.

Usage:
  pnpm article:new
  pnpm article:new:dry
  pnpm article:new --since <git-ref> [--model <model-id>]

Options:
  --dry-run       Print the Git evidence without invoking Codex.
  --since REF     Override the stored baseline commit.
  --through REF   Override the ending commit for a dry run only.
  --model ID      Override the configured Codex model for this run.
  -h, --help      Show this help.`)
}

function requireCleanWorkingTree() {
  const status = git(['status', '--porcelain=v1', '--untracked-files=all'])

  if (status) {
    throw new Error(
      'The working tree must be clean before article generation. Commit or stash existing work first.'
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function readState(): FeatureUpdateState {
  const parsed: unknown = JSON.parse(readFileSync(statePath, 'utf8'))

  if (!isRecord(parsed))
    throw new Error('Feature-update state must be an object.')

  if (
    parsed.version !== 1 ||
    !isNullableString(parsed.lastCoveredCommit) ||
    !isNullableString(parsed.lastCoveredAt) ||
    !isNullableString(parsed.lastArticlePath)
  ) {
    throw new Error('Feature-update state has an invalid shape.')
  }

  return {
    version: 1,
    lastCoveredCommit: parsed.lastCoveredCommit,
    lastCoveredAt: parsed.lastCoveredAt,
    lastArticlePath: parsed.lastArticlePath
  }
}

function parseGenerationResult(raw: string): GenerationResult {
  const parsed: unknown = JSON.parse(raw)

  if (!isRecord(parsed)) throw new Error('Codex result must be an object.')

  const { status } = parsed
  const validStatus =
    status === 'generated' || status === 'no_publishable_changes'

  if (
    !validStatus ||
    typeof parsed.slug !== 'string' ||
    typeof parsed.title !== 'string' ||
    typeof parsed.description !== 'string' ||
    typeof parsed.readingTime !== 'string' ||
    typeof parsed.summary !== 'string' ||
    typeof parsed.articleBody !== 'string' ||
    !isStringArray(parsed.coveredFeatures) ||
    !isStringArray(parsed.excludedChanges)
  ) {
    throw new Error('Codex returned an invalid generation result.')
  }

  return {
    status,
    slug: parsed.slug,
    title: parsed.title,
    description: parsed.description,
    readingTime: parsed.readingTime,
    summary: parsed.summary,
    articleBody: parsed.articleBody,
    coveredFeatures: parsed.coveredFeatures,
    excludedChanges: parsed.excludedChanges
  }
}

function findInitialBaseline() {
  const additions = git([
    'log',
    '--follow',
    '--diff-filter=A',
    '--format=%H',
    '--',
    scriptRelativePath
  ])
    .split('\n')
    .filter(Boolean)

  const introductionCommit = additions.at(-1)

  if (!introductionCommit) {
    throw new Error(
      'The article generator has not been committed yet. Commit this workflow before its first use, or pass --since <git-ref>.'
    )
  }

  return introductionCommit
}

function resolveCommit(ref: string, label: string) {
  const result = spawnSync(
    'git',
    ['rev-parse', '--verify', `${ref}^{commit}`],
    {
      cwd: repositoryDirectory,
      encoding: 'utf8'
    }
  )

  if (result.error) throw result.error

  if (result.status !== 0) {
    throw new Error(`Could not resolve the ${label} Git ref: ${ref}`)
  }

  return result.stdout.trim()
}

function requireAncestor(baselineCommit: string, throughCommit: string) {
  const result = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', baselineCommit, throughCommit],
    { cwd: repositoryDirectory }
  )

  if (result.error) throw result.error

  if (result.status !== 0) {
    throw new Error(
      `The stored baseline ${baselineCommit} is not an ancestor of ${throughCommit}. Run again with --since <git-ref> after checking rewritten history.`
    )
  }
}

interface GitEvidence {
  branch: string
  commitCount: number
  commitLog: string
  changedFiles: string[]
  changedFileReport: string
  diffStat: string
}

function collectEvidence(range: string): GitEvidence {
  const pathArgs = ['--', ...productPaths]
  const changedFileReport = git([
    'diff',
    '--find-renames',
    '--name-status',
    range,
    ...pathArgs
  ])
  const changedFiles = changedFileReport
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t').at(-1))
    .filter((path): path is string => Boolean(path))

  const rawCount = git([
    'rev-list',
    '--no-merges',
    '--count',
    range,
    ...pathArgs
  ])

  return {
    branch: git(['branch', '--show-current']) || '(detached HEAD)',
    commitCount: Number.parseInt(rawCount, 10),
    commitLog: git([
      'log',
      '--no-merges',
      '--reverse',
      '--format=%H%x09%cI%x09%an%x09%s',
      range,
      ...pathArgs
    ]),
    changedFiles,
    changedFileReport,
    diffStat: git(['diff', '--find-renames', '--stat', range, ...pathArgs])
  }
}

function printEvidenceSummary(
  baselineCommit: string,
  throughCommit: string,
  evidence: GitEvidence
) {
  console.log(`Authier feature-update evidence
Branch: ${evidence.branch}
Range: ${baselineCommit}..${throughCommit}
Product commits: ${evidence.commitCount}
Changed product files: ${evidence.changedFiles.length}`)

  if (evidence.commitLog) {
    console.log(`\nCommits:\n${evidence.commitLog}`)
  }

  if (evidence.changedFileReport) {
    console.log(`\nChanged files:\n${evidence.changedFileReport}`)
  }

  if (evidence.diffStat) {
    console.log(`\nDiff stat:\n${evidence.diffStat}`)
  }
}

function buildPrompt(
  baselineCommit: string,
  throughCommit: string,
  evidence: GitEvidence
) {
  const instructions = readFileSync(promptPath, 'utf8').trim()
  const generationDate = new Date().toISOString().slice(0, 10)

  return `${instructions}

## Run context

- Generation date: ${generationDate}
- Repository branch: ${evidence.branch}
- Baseline commit: ${baselineCommit}
- Ending commit: ${throughCommit}
- Git range: ${baselineCommit}..${throughCommit}
- Product paths: ${productPaths.join(', ')}
- Product commit count: ${evidence.commitCount}

## Untrusted commit index

${evidence.commitLog || '(No non-merge product commits found.)'}

## Changed product files

${evidence.changedFileReport || '(No changed product files found.)'}

## Diff stat

${evidence.diffStat || '(Empty diff stat.)'}

Use Git commands with the exact range above to inspect patches and use \
\`git show ${throughCommit}:<path>\` when the ending revision matters. Do not widen the range.`
}

function getResultPath() {
  const gitDirectory = git(['rev-parse', '--git-dir'])
  const absoluteGitDirectory = resolve(repositoryDirectory, gitDirectory)
  return join(
    absoluteGitDirectory,
    `authier-feature-article-result-${process.pid}.json`
  )
}

function runCodex(prompt: string, resultPath: string) {
  runVisible('codex', ['login', 'status'])

  const args = [
    '-a',
    'never',
    'exec',
    '--sandbox',
    'read-only',
    '--cd',
    repositoryDirectory,
    '--ephemeral',
    '--output-schema',
    resultSchemaPath,
    '--output-last-message',
    resultPath
  ]

  if (values.model) args.push('--model', values.model)
  args.push('-')

  runVisible('codex', args, prompt)
}

function listWorkingTreeChanges() {
  const tracked = git(['diff', '--name-only', 'HEAD'])
    .split('\n')
    .filter(Boolean)
  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)

  return [...new Set([...tracked, ...untracked])].sort()
}

function validateGenerationResult(result: GenerationResult) {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  if (!slugPattern.test(result.slug)) {
    throw new Error(`Codex returned an invalid article slug: ${result.slug}`)
  }

  const articlePath = `landing-page/src/pages/blog/${result.slug}.astro`

  if (existsSync(resolve(repositoryDirectory, articlePath))) {
    throw new Error(`An article already exists at ${articlePath}.`)
  }

  if (result.title.length < 10 || result.title.length > 55) {
    throw new Error('The generated title must contain 10–55 characters.')
  }

  validateSingleLineText(result.title, 'title')

  if (result.description.length < 110 || result.description.length > 160) {
    throw new Error(
      'The generated description must contain 110–160 characters.'
    )
  }

  validateSingleLineText(result.description, 'description')

  if (!/^[1-9]\d* min read$/.test(result.readingTime)) {
    throw new Error('The generated reading time must look like "6 min read".')
  }

  if (!result.summary.trim()) {
    throw new Error('The generated editorial summary is empty.')
  }

  validateSingleLineText(result.summary, 'editorial summary')

  if (result.coveredFeatures.length === 0) {
    throw new Error(
      'The generated article does not identify any covered features.'
    )
  }

  validateArticleBody(result.articleBody)

  return articlePath
}

function validateSingleLineText(value: string, label: string) {
  if (value !== value.trim() || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`The generated ${label} must be clean, single-line text.`)
  }
}

function validateArticleBody(articleBody: string) {
  const wordCount = articleBody
    .replaceAll(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

  if (wordCount < 250 || wordCount > 2_000) {
    throw new Error(
      `The generated article body contains ${wordCount} words; expected 250–2,000.`
    )
  }

  if (
    articleBody.includes('{') ||
    articleBody.includes('}') ||
    articleBody.includes('<!--') ||
    articleBody.includes('<!') ||
    articleBody.includes('<?')
  ) {
    throw new Error(
      'The generated article contains Astro expressions or unsupported markup.'
    )
  }

  const tagPattern = /<[^>]+>/g
  const tags = [...articleBody.matchAll(tagPattern)].map((match) => match[0])
  const textOnly = articleBody.replaceAll(tagPattern, '')

  if (/[<>]/.test(textOnly)) {
    throw new Error('The generated article contains malformed HTML.')
  }

  const stack: string[] = []

  for (const tag of tags) validateArticleTag(tag, stack)

  if (stack.length > 0) {
    throw new Error(`The generated article leaves <${stack.at(-1)}> unclosed.`)
  }
}

function validateArticleTag(tag: string, stack: string[]) {
  const match = tag.match(/^<(\/)?([a-z][a-z0-9-]*)([^>]*)>$/i)

  if (!match)
    throw new Error(`The generated article has an invalid tag: ${tag}`)

  const [, closingMarker, rawName, attributes = ''] = match

  if (!rawName) {
    throw new Error(`The generated article has an invalid tag: ${tag}`)
  }

  const closing = Boolean(closingMarker)
  const name = rawName.toLowerCase()
  if (!allowedArticleTags.has(name)) {
    throw new Error(`The generated article uses unsupported <${name}> markup.`)
  }

  if (closing) {
    if (attributes.trim()) {
      throw new Error(`Closing </${name}> must not contain attributes.`)
    }

    const openName = stack.pop()

    if (openName !== name) {
      throw new Error(`The generated article has an unmatched </${name}> tag.`)
    }

    return
  }

  validateArticleAttributes(name, attributes)
  stack.push(name)
}

function validateArticleAttributes(name: string, attributes: string) {
  const trimmedAttributes = attributes.trim()

  if (name === 'a') {
    const hrefMatch = trimmedAttributes.match(/^href="([^"]+)"$/)

    if (!hrefMatch) {
      throw new Error('Generated links may contain only a double-quoted href.')
    }

    const href = hrefMatch[1] ?? ''
    const safeInternalHref =
      href.startsWith('/') &&
      !href.startsWith('//') &&
      /^\/[a-z0-9/_#?&=.%~-]*$/i.test(href)

    if (!safeInternalHref) {
      throw new Error(`The generated article has an unsafe link: ${href}`)
    }

    return
  }

  if (name === 'div') {
    if (trimmedAttributes !== 'class="article-callout"') {
      throw new Error(
        'Generated div elements must use only class="article-callout".'
      )
    }

    return
  }

  if (trimmedAttributes) {
    throw new Error(`Generated <${name}> elements must not have attributes.`)
  }
}

function writeGeneratedDraft(result: GenerationResult, articlePath: string) {
  const generationDate = new Date().toISOString().slice(0, 10)
  const articleSource = `---
import ArticleLayout from '../../layouts/ArticleLayout.astro'
---

<ArticleLayout
  title={${JSON.stringify(result.title)}}
  description={${JSON.stringify(result.description)}}
  publishedAt="${generationDate}"
  updatedAt="${generationDate}"
  readingTime={${JSON.stringify(result.readingTime)}}
>
${result.articleBody.trim()}
</ArticleLayout>
`
  const blogDataSource = readFileSync(
    resolve(repositoryDirectory, blogDataPath),
    'utf8'
  )
  const insertionMarker = 'export const blogPosts = [\n'
  const markerCount = blogDataSource.split(insertionMarker).length - 1

  if (markerCount !== 1) {
    throw new Error(
      `Expected one blog-post insertion marker in ${blogDataPath}; found ${markerCount}.`
    )
  }

  const blogEntry = `  {
    title: ${JSON.stringify(result.title)},
    description: ${JSON.stringify(result.description)},
    href: ${JSON.stringify(`/blog/${result.slug}`)},
    publishedAt: '${generationDate}',
    updatedAt: '${generationDate}',
    readingTime: ${JSON.stringify(result.readingTime)},
    category: 'Product update'
  },
`
  const nextBlogDataSource = blogDataSource.replace(
    insertionMarker,
    `${insertionMarker}${blogEntry}`
  )

  writeFileSync(resolve(repositoryDirectory, articlePath), articleSource)
  writeFileSync(resolve(repositoryDirectory, blogDataPath), nextBlogDataSource)
}

function validateDraftChanges(articlePath: string) {
  const changedPaths = listWorkingTreeChanges()
  const allowedPaths = new Set([blogDataPath, articlePath])
  const unexpectedPaths = changedPaths.filter((path) => !allowedPaths.has(path))

  if (unexpectedPaths.length > 0) {
    throw new Error(
      `Article generation changed files outside its scope: ${unexpectedPaths.join(', ')}`
    )
  }

  if (!changedPaths.includes(blogDataPath)) {
    throw new Error(`Article generation did not update ${blogDataPath}.`)
  }

  if (!changedPaths.includes(articlePath)) {
    throw new Error(`Article generation did not create ${articlePath}.`)
  }
}

function printResultList(label: string, values: readonly string[]) {
  if (values.length === 0) return

  console.log(`\n${label}:`)

  for (const value of values) console.log(`- ${value}`)
}

function formatAndValidate(articlePath: string) {
  runVisible('pnpm', ['exec', 'oxfmt', blogDataPath, articlePath])
  runVisible('pnpm', ['--dir', 'landing-page', 'build'])
  runVisible('pnpm', ['--dir', 'landing-page', 'check:seo'])
}
