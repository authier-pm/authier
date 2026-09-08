import { describe, expect, it } from 'bun:test'
import {
  parseAndroidReleaseTag,
  verifyAndroidReleaseManifest
} from './androidRelease'
import { verifyAndroidApi } from './checkAndroidApi'
import openapi from '../shared/openapi/authier.json'

describe('Android release versioning', () => {
  it('derives increasing repeatable Android version codes from semantic tags', () => {
    const tags = [
      'v0.1.0-android',
      'v0.1.1-android',
      'v0.2.0-android',
      'v1.0.0-android'
    ]
    expect(tags.map((tag) => parseAndroidReleaseTag(tag).versionCode)).toEqual([
      1000, 1001, 2000, 1_000_000
    ])
    expect(parseAndroidReleaseTag(tags[1])).toEqual(
      parseAndroidReleaseTag(tags[1])
    )
  })
  it('rejects invalid, ambiguous, zero, and overflowing versions', () => {
    for (const tag of [
      'v1.2.3',
      'v1.2.3-extension',
      'v01.2.3-android',
      'v1.2.3-android\n',
      'v0.0.0-android',
      'v2100.0.0-android',
      'v1.1000.0-android',
      'v1.0.1000-android',
      'v1.2.3-rc.1-android'
    ])
      expect(() => parseAndroidReleaseTag(tag)).toThrow()
  })
})

describe('Android publication checks', () => {
  const release = parseAndroidReleaseTag('v1.2.3-android')
  const badging =
    "package: name='dev.authier.android' versionCode='1002003' versionName='1.2.3'"
  const manifest =
    'A: android:allowBackup(0x01010280)=false\nA: android:usesCleartextTraffic(0x010104ec)=false\n'
  it('accepts the correct production package and rejects development or wrong-version APKs', () => {
    expect(() =>
      verifyAndroidReleaseManifest(badging, manifest, release)
    ).not.toThrow()
    for (const invalid of [
      badging.replace('1002003', '1'),
      badging.replace('dev.authier.android', 'dev.authier.android.debug'),
      `${badging}\napplication-debuggable`
    ])
      expect(() =>
        verifyAndroidReleaseManifest(invalid, manifest, release)
      ).toThrow()
  })
  it('rejects backups, cleartext, debug flags and debug-only activities', () => {
    for (const invalid of [
      manifest.replace('=false', '=true'),
      manifest.replace(
        'usesCleartextTraffic(0x010104ec)=false',
        'usesCleartextTraffic(0x010104ec)=true'
      ),
      `${manifest}A: android:debuggable(0x0101000f)=true`,
      `${manifest}AutofillPreviewActivity`
    ])
      expect(() =>
        verifyAndroidReleaseManifest(badging, invalid, release)
      ).toThrow()
  })
  it('requires deployed native routes and passkey-compatible records', () => {
    expect(() => verifyAndroidApi(openapi)).not.toThrow()
    const oldApi = structuredClone(openapi)
    Reflect.deleteProperty(oldApi.paths, '/vault/sync')
    expect(() => verifyAndroidApi(oldApi)).toThrow('missing /vault/sync')
    expect(() => verifyAndroidApi({ message: 'Not Found' })).toThrow()
  })
})
