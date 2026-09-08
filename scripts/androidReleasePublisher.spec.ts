import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const publisher = fileURLToPath(
  new URL('./publishAndroidRelease.sh', import.meta.url)
)
const sha = 'a'.repeat(40)
const apk = 'authier-0.1.0-android.apk'
let directory: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'authier-publisher-'))
  await mkdir(join(directory, 'bin'))
  await mkdir(join(directory, 'release-apk'))
  await mkdir(join(directory, 'remote'))
  await writeFile(join(directory, 'release-apk', apk), 'signed APK fixture')
  await writeFile(join(directory, 'release-apk/SHA256SUMS'), 'checksum fixture')
  await writeFile(join(directory, 'calls.jsonl'), '')
  await writeFile(
    join(directory, 'bin/git'),
    '#!/bin/sh\nprintf "%s\\trefs/tags/%s^{}\\n" "$REMOTE_SHA" "$ANDROID_RELEASE_TAG"\n'
  )
  await writeFile(
    join(directory, 'bin/gh'),
    `#!/usr/bin/env bun
import { appendFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
const operation = args[1];
if (operation === 'view') {
  if (!process.env.EXISTING_RELEASE) process.exit(1);
  console.log(process.env.EXISTING_RELEASE);
} else if (operation === 'download') {
  const name = args[args.indexOf('--pattern') + 1];
  const directory = args[args.indexOf('--dir') + 1];
  copyFileSync(join(process.cwd(), 'remote', name), join(directory, name));
} else {
  appendFileSync('calls.jsonl', JSON.stringify(args) + '\\n');
}
`
  )
  await chmod(join(directory, 'bin/git'), 0o755)
  await chmod(join(directory, 'bin/gh'), 0o755)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

const publish = async (
  existing?: { isDraft: boolean; assets: { name: string }[] },
  remoteSha = sha
) => {
  const process = Bun.spawn(['bash', publisher], {
    cwd: directory,
    env: {
      ...Bun.env,
      PATH: `${join(directory, 'bin')}:${Bun.env.PATH}`,
      REMOTE_SHA: remoteSha,
      ANDROID_RELEASE_TAG: 'v0.1.0-android',
      ANDROID_VERSION_NAME: '0.1.0',
      ANDROID_SOURCE_REF: sha,
      GH_REPO: 'fixture/authier',
      EXISTING_RELEASE: existing ? JSON.stringify(existing) : ''
    },
    stdout: 'pipe',
    stderr: 'pipe'
  })
  const status = await process.exited
  const errors = await new Response(process.stderr).text()
  const calls = (await readFile(join(directory, 'calls.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line): string[] => JSON.parse(line))
  return { status, errors, calls }
}

describe('Android release publication', () => {
  it('creates the verified tag release with both assets and preserves extension latest', async () => {
    const result = await publish()
    expect(result.status).toBe(0)
    expect(result.calls).toHaveLength(1)
    expect(result.calls[0]).toContain('--verify-tag')
    expect(result.calls[0]).toContain('--latest=false')
    expect(result.calls[0]).toContain(`release-apk/${apk}`)
    expect(result.calls[0]).toContain('release-apk/SHA256SUMS')
  })
  it('refuses a tag moved after the build', async () => {
    const result = await publish(undefined, 'b'.repeat(40))
    expect(result.status).not.toBe(0)
    expect(result.calls).toEqual([])
    expect(result.errors).toContain('no longer points')
  })
  it('refuses to replace an existing APK with different bytes', async () => {
    await writeFile(join(directory, 'remote', apk), 'different published APK')
    const result = await publish({ isDraft: false, assets: [{ name: apk }] })
    expect(result.status).not.toBe(0)
    expect(result.calls).toEqual([])
    expect(result.errors).toContain('different bytes')
  })
  it('resumes a partial draft without replacing an uploaded APK', async () => {
    await cp(
      join(directory, 'release-apk', apk),
      join(directory, 'remote', apk)
    )
    const result = await publish({ isDraft: true, assets: [{ name: apk }] })
    expect(result.status).toBe(0)
    expect(result.calls).toEqual([
      ['release', 'upload', 'v0.1.0-android', 'release-apk/SHA256SUMS'],
      ['release', 'edit', 'v0.1.0-android', '--draft=false', '--latest=false']
    ])
  })
})
