import { expect } from '@playwright/test'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function profileFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) return profileFiles(path)
        return entry.isFile() ? [path] : []
      })
    )
  ).flat()
}

export async function profileFilesContainingKeys(
  profile: string,
  keys: readonly Buffer[]
) {
  const representations = keys.flatMap((key) => [
    key,
    Buffer.from(key.toString('base64')),
    Buffer.from(key.toString('base64'), 'utf16le')
  ])
  const found: string[] = []
  for (const file of await profileFiles(profile)) {
    const data = await readFile(file)
    if (representations.some((value) => data.includes(value))) found.push(file)
  }
  return found
}

export async function expectNoProfileKeys(
  profile: string,
  keys: readonly Buffer[]
) {
  expect(await profileFilesContainingKeys(profile, keys)).toEqual([])
}
