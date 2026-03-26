import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const scriptsDirectoryPath = path.dirname(currentFilePath)
const packageDirectoryPath = path.resolve(scriptsDirectoryPath, '..')
const workspaceNodeModulesPath = path.resolve(packageDirectoryPath, '../node_modules')
const packageNodeModulesPath = path.join(packageDirectoryPath, 'node_modules')

const getPackageVersion = (packageJsonPath) => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  return packageJson.version
}

const getMajorVersion = (version) => {
  const [majorVersion] = version.split('.')
  return Number(majorVersion)
}

if (!fs.existsSync(packageNodeModulesPath)) {
  process.exit(0)
}

const packageNodeModulesStats = fs.lstatSync(packageNodeModulesPath)
if (packageNodeModulesStats.isSymbolicLink()) {
  process.exit(0)
}

const packageLruCachePackageJsonPath = path.join(
  packageNodeModulesPath,
  'lru-cache/package.json'
)
const workspaceLruCachePackageJsonPath = path.join(
  workspaceNodeModulesPath,
  'lru-cache/package.json'
)

if (
  !fs.existsSync(packageLruCachePackageJsonPath) ||
  !fs.existsSync(workspaceLruCachePackageJsonPath)
) {
  process.exit(0)
}

const packageLruCacheVersion = getPackageVersion(packageLruCachePackageJsonPath)
const workspaceLruCacheVersion = getPackageVersion(
  workspaceLruCachePackageJsonPath
)

if (
  getMajorVersion(packageLruCacheVersion) >= 11 ||
  getMajorVersion(workspaceLruCacheVersion) < 11
) {
  process.exit(0)
}

fs.rmSync(packageNodeModulesPath, { force: true, recursive: true })

console.warn(
  [
    `Removed stale ${path.relative(process.cwd(), packageNodeModulesPath)}.`,
    `It contained lru-cache@${packageLruCacheVersion}, which breaks Vitest worker startup.`,
    `The workspace install provides lru-cache@${workspaceLruCacheVersion}.`
  ].join(' ')
)
