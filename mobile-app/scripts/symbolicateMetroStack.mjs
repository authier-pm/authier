#!/usr/bin/env node

import process from 'node:process'

const DEFAULT_METRO_BASE = process.env.METRO_BASE_URL ?? 'http://127.0.0.1:8081'
const DEFAULT_BUNDLE_URL =
  process.env.METRO_BUNDLE_URL ??
  `${DEFAULT_METRO_BASE}/index.bundle?platform=android&dev=true&lazy=true&minify=false&app=com.authier&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server`

const usage = `Usage:
  pnpm symbolicate 356178:53 [356200:12 ...]
  pbpaste | pnpm symbolicate

Env overrides:
  METRO_BASE_URL=http://127.0.0.1:8081
  METRO_BUNDLE_URL=http://127.0.0.1:8081/index.bundle?...`

const readStdin = async () => {
  if (process.stdin.isTTY) return ''
  let data = ''
  for await (const chunk of process.stdin) {
    data += chunk
  }
  return data
}

const parseFrameToken = (token) => {
  const match = token.match(/(\d+):(\d+)$/)
  if (!match) return null
  return {
    lineNumber: Number(match[1]),
    column: Number(match[2]),
  }
}

const extractFramesFromText = (text) => {
  const matches = [...text.matchAll(/(?:url-server|index\.bundle[^:\s)]*):(\d+):(\d+)/g)]
  return matches.map((match) => ({
    lineNumber: Number(match[1]),
    column: Number(match[2]),
  }))
}

const uniqueFrames = (frames) => {
  const seen = new Set()
  return frames.filter((frame) => {
    const key = `${frame.lineNumber}:${frame.column}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const stdinText = await readStdin()
const argFrames = process.argv.slice(2).map(parseFrameToken).filter(Boolean)
const stdinFrames = stdinText ? extractFramesFromText(stdinText) : []
const frames = uniqueFrames([...argFrames, ...stdinFrames])

if (frames.length === 0) {
  console.error(usage)
  process.exit(1)
}

const payload = {
  stack: frames.map((frame) => ({
    methodName: '<unknown>',
    file: DEFAULT_BUNDLE_URL,
    lineNumber: frame.lineNumber,
    column: frame.column,
  })),
  version: 0,
}

const response = await fetch(`${DEFAULT_METRO_BASE}/symbolicate`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify(payload),
})

if (!response.ok) {
  console.error(`Metro symbolicate failed: ${response.status} ${response.statusText}`)
  console.error(await response.text())
  process.exit(1)
}

const result = await response.json()
const stack = Array.isArray(result.stack) ? result.stack : []

for (const frame of stack) {
  const methodName = frame.methodName ?? '<unknown>'
  const file = frame.file ?? '<unknown file>'
  const line = frame.lineNumber ?? '?'
  const column = frame.column ?? '?'
  console.log(`${methodName} @ ${file}:${line}:${column}`)
}
