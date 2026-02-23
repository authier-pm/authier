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

interface IIpApiComSuccessResponse {
  status: 'success'
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  query: string
  proxy?: boolean
  hosting?: boolean
}

interface IIpApiComFailResponse {
  status: 'fail'
  message: string
  query?: string
}

type IIpApiComResponse = IIpApiComSuccessResponse | IIpApiComFailResponse

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
      `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,query,proxy,hosting`
    )
    const bodyText = await res.text()

    if (res.status > 201) {
      console.warn('Failed to get geo location for ip', ipAddress)
      return null
    }

    try {
      const json = JSON.parse(bodyText) as IIpApiComResponse

      if (json.status !== 'success') {
        console.warn(
          'Geo location lookup failed for ip',
          ipAddress,
          json.message
        )
        return null
      }

      return {
        callingCode: '',
        city: json.city ?? '',
        countryCapital: '',
        country_code: json.countryCode ?? '',
        country_name: json.country ?? '',
        currency: '',
        currencySymbol: '',
        emojiFlag: '',
        flagUrl: '',
        ip: json.query ?? ipAddress,
        is_in_european_union: false,
        latitude: json.lat ?? 0,
        longitude: json.lon ?? 0,
        metro_code: 0,
        organisation: json.org ?? json.isp ?? '',
        region_code: json.region ?? '',
        region_name: json.regionName ?? '',
        suspiciousFactors: {
          isProxy: Boolean(json.proxy),
          isSpam: false,
          isSuspicious: Boolean(json.proxy || json.hosting),
          isTorNode: false
        },
        time_zone: json.timezone ?? '',
        zip_code: json.zip ?? ''
      } satisfies IIpApiResponse
    } catch {
      console.warn(
        'Failed to parse geo location response for ip',
        ipAddress,
        bodyText.slice(0, 120)
      )
      return null
    }
  },
  {
    cachePrefix: 'geoIpLocation',
    maxAge: 60 * 60 * 24 * 21 // 21 days
  }
)
