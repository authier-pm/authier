import os from 'os'

export function getDbCount() {
  return os.cpus().length ?? 16
}
