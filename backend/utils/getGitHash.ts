import fs from 'fs'
export function getGitHash() {
  let gitSha
  try {
    gitSha = fs.readFileSync('git-commit-hash', 'utf8').trim()
  } catch (err) {
    gitSha = require('child_process')
      .execSync('git rev-parse HEAD')
      .toString()
      .trim()
  }
  return gitSha.substring(0, 8) // we cut to 8 chars because we don't care about hash collisions and whatnot
}
