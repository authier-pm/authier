import { lookup } from 'dns/promises'
import debug from 'debug'

const log = debug('au:isTorExit')

function reverseIp(ip: string) {
  return ip.split('.').reverse().join('.')
}

// https://github.com/assafmo/IsTorExit/pull/4
export async function isTorExit(ip: string) {
  let outputAddress
  try {
    const result = await lookup(`${reverseIp(ip)}.dnsel.torproject.org`)
    outputAddress = result.address
  } catch (e: any) {
    if (e && e.code == 'ENOTFOUND') {
      log(ip, false)

      return false
    } else {
      throw e
    }
  }

  if (!outputAddress) {
    log(ip, false)

    return false
  }

  const answer =
    outputAddress.startsWith('127.0.0.') && outputAddress != '127.0.0.1'

  log(ip, answer)

  return answer
}
