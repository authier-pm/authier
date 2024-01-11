import { describe, expect, it } from 'vitest'
import { isTorExit } from './isTorExit'

describe('isTorExit', () => {
  it('should return true for a Tor exit node', async () => {
    const res = await isTorExit('2.58.56.220') // a random address from https://www.dan.me.uk/tornodes we might need to change it in the future if the node goes down
    expect(res).toBe(true)
  })
})
