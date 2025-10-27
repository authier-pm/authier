import { describe, expect, it } from 'vitest'
import { getGeoIpLocation } from './getGeoIpLocation'

describe('getGeoIpLocation', async () => {
  it('should return a location', async () => {
    const res = await getGeoIpLocation.memoized('89.176.72.144')
    expect(res.country_name).toEqual('Czechia')
  })
}, 10000)
