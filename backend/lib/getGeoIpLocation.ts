import { fetch } from 'undici'
import { memRedis } from './memRedis'

// TODO memoize this function into redis so that we don't hit the API limit

export interface IIpApiResponse {
  callingCode: string
  city: string
  countryCapital: string
  country_code: string
  country_name: string
  currency: string
  currencySymbol: string
  emojiFlag: string
  flagUrl: string
  ip: string
  is_in_european_union: boolean
  latitude: number
  longitude: number
  metro_code: number
  organisation: string
  region_code: string
  region_name: string
  suspiciousFactors: SuspiciousFactors
  time_zone: string
  zip_code: string
}

export interface SuspiciousFactors {
  isProxy: boolean
  isSpam: boolean
  isSuspicious: boolean
  isTorNode: boolean
}

const { env } = process

export const getGeoIpLocation = memRedis(
  async function getGeoIpLocation(ipAddress: string) {
    if (ipAddress === '127.0.0.1') {
      return {
        callingCode: '61',
        city: '',
        countryCapital: 'Canberra',
        country_code: 'AU',
        country_name: 'Australia',
        currency: 'AUD',
        currencySymbol: '$',
        emojiFlag: '🇦🇺',
        flagUrl: 'https://ip-api.io/images/flags/au.svg',
        ip: '127.0.0.1',
        is_in_european_union: false,
        latitude: -33.494,
        longitude: 143.2104,
        metro_code: 0,
        organisation: '',
        region_code: '',
        region_name: '',
        suspiciousFactors: {
          isProxy: false,
          isSpam: true,
          isSuspicious: true,
          isTorNode: false
        },
        time_zone: 'Australia/Sydney',
        zip_code: ''
      } as IIpApiResponse
    }
    const res = await fetch(
      `https://ip-api.io/json/${ipAddress}?api_key=${env.IP_API_IO_API_KEY}`
    )

    if (res.status > 201) {
      console.warn('Failed to get geo location for ip', ipAddress)
    }
    const json = (await res.json()) as IIpApiResponse

    return json
  },
  {
    cachePrefix: 'geoIpLocation',
    maxAge: 60 * 60 * 24 * 21 // 21 days
  }
)
