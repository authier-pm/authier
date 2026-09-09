import { describe, expect, it } from 'bun:test'
import {
  androidObtainiumDeepLink,
  androidObtainiumSettings,
  androidObtainiumUrl
} from '../shared/androidDistribution'

describe('Obtainium Android distribution', () => {
  it('round-trips the redirect into Obtainium’s exported App format', () => {
    expect(new URL(androidObtainiumUrl).searchParams.get('r')).toBe(
      androidObtainiumDeepLink
    )
    const config = JSON.parse(
      decodeURIComponent(
        androidObtainiumDeepLink.slice('obtainium://app/'.length)
      )
    )
    expect(config.id).toBe('dev.authier.android')
    expect(config.url).toBe('https://github.com/authier-pm/authier')
    expect(typeof config.additionalSettings).toBe('string')
    expect(JSON.parse(config.additionalSettings)).toEqual(
      androidObtainiumSettings
    )
    expect(config.installedVersion).toBeUndefined()
    expect(config.latestVersion).toBeUndefined()
  })

  it('finds the signed Android APK even after an extension release', () => {
    const releases = [
      { name: 'Authier Extension 1.2.13', assets: ['authier.zip'] },
      {
        name: 'Authier Android 0.1.2',
        assets: ['authier-0.1.2-android.apk', 'SHA256SUMS', 'app-debug.apk']
      }
    ]
    expect(androidObtainiumSettings.fallbackToOlderReleases).toBe(true)
    expect(androidObtainiumSettings.verifyLatestTag).toBe(false)
    const release = releases.find(({ name }) =>
      new RegExp(androidObtainiumSettings.filterReleaseTitlesByRegEx).test(name)
    )
    expect(
      release?.assets.filter((name) =>
        new RegExp(androidObtainiumSettings.apkFilterRegEx).test(name)
      )
    ).toEqual(['authier-0.1.2-android.apk'])
    expect(androidObtainiumSettings.includePrereleases).toBe(false)
  })

  it('extracts Android’s installed version for silent-update detection', () => {
    const pattern = new RegExp(androidObtainiumSettings.versionExtractionRegEx)
    expect(
      'v0.1.2-android'.replace(
        pattern,
        androidObtainiumSettings.matchGroupToUse
      )
    ).toBe('0.1.2')
    expect(
      'v1.10.123-android'.replace(
        pattern,
        androidObtainiumSettings.matchGroupToUse
      )
    ).toBe('1.10.123')
    expect(pattern.test('v0.1.2-extension')).toBe(false)
    expect(pattern.test('v0.1.2-beta-android')).toBe(false)
    expect(androidObtainiumSettings.exemptFromBackgroundUpdates).toBe(false)
  })
})
