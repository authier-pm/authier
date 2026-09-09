// Obtainium's exported App format stores additionalSettings as JSON text.
// https://wiki.obtainium.imranr.dev/deep_links/#import-a-full-config
export const androidObtainiumSettings = {
  includePrereleases: false,
  fallbackToOlderReleases: true,
  verifyLatestTag: false,
  filterReleaseTitlesByRegEx: '^Authier Android [0-9]+\\.[0-9]+\\.[0-9]+$',
  apkFilterRegEx: '^authier-[0-9]+\\.[0-9]+\\.[0-9]+-android\\.apk$',
  versionExtractionRegEx: '^v([0-9]+\\.[0-9]+\\.[0-9]+)-android$',
  matchGroupToUse: '$1',
  versionDetection: true,
  trackOnly: false,
  exemptFromBackgroundUpdates: false
} as const

export const androidObtainiumConfig = {
  id: 'dev.authier.android',
  url: 'https://github.com/authier-pm/authier',
  author: 'authier-pm',
  name: 'Authier',
  additionalSettings: JSON.stringify(androidObtainiumSettings)
} as const

export const androidObtainiumDeepLink = `obtainium://app/${encodeURIComponent(JSON.stringify(androidObtainiumConfig))}`

// The official redirect offers Obtainium installation when it isn't installed.
export const androidObtainiumUrl = `https://apps.obtainium.imranr.dev/redirect?r=${encodeURIComponent(androidObtainiumDeepLink)}`
export const androidReleasesUrl =
  'https://github.com/authier-pm/authier/releases?q=-android&expanded=true'
