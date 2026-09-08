import { join } from 'node:path'

export const parseAndroidReleaseTag = (tag: string) => {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-android$/.exec(tag)
  if (!match || match[0] !== tag)
    throw new Error('Use an Android tag such as v1.2.3-android')
  const [major, minor, patch] = match.slice(1).map(Number)
  if (major > 2099 || minor > 999 || patch > 999)
    throw new Error(
      'Android versions support major 0–2099 and minor/patch 0–999'
    )
  const versionCode = major * 1_000_000 + minor * 1000 + patch
  if (versionCode === 0)
    throw new Error('The Android version must be greater than 0.0.0')
  return { tag, versionName: `${major}.${minor}.${patch}`, versionCode }
}

export const verifyAndroidReleaseManifest = (
  badging: string,
  manifest: string,
  release: ReturnType<typeof parseAndroidReleaseTag>
) => {
  const packageLine = badging
    .split('\n')
    .find((line) => line.startsWith('package:'))
  if (
    !packageLine?.includes("name='dev.authier.android'") ||
    !packageLine.includes(`versionCode='${release.versionCode}'`) ||
    !packageLine.includes(`versionName='${release.versionName}'`)
  )
    throw new Error(
      'APK package or version does not match this Android release'
    )
  if (
    badging.includes('application-debuggable') ||
    /android:debuggable[^\n]*=(?:true|\(type 0x12\)0xffffffff)/.test(
      manifest
    ) ||
    manifest.includes('AutofillPreviewActivity')
  )
    throw new Error('Refusing to publish a debug APK or demo activity')
  for (const attribute of ['allowBackup', 'usesCleartextTraffic']) {
    if (
      !new RegExp(
        `android:${attribute}[^\\n]*=(?:false|\\(type 0x12\\)0x0)(?:\\s|$)`
      ).test(manifest)
    )
      throw new Error(`Release APK must disable ${attribute}`)
  }
}

if (import.meta.main) {
  const command = process.argv[2] ?? 'prepare'
  if (command === 'prepare') {
    const publish = process.env.ANDROID_PUBLISH === 'true'
    const isTag = process.env.GITHUB_REF_TYPE === 'tag'
    if (publish && !isTag)
      throw new Error(
        'Publishing requires an existing Android tag; branch builds are artifacts only'
      )
    const tag = isTag
      ? process.env.GITHUB_REF_NAME
      : `v${process.env.ANDROID_VERSION_NAME ?? '0.1.0'}-android`
    const release = parseAndroidReleaseTag(tag ?? '')
    const sourceRef = process.env.GITHUB_SHA ?? ''
    if (!/^[a-f0-9]{40}$/.test(sourceRef))
      throw new Error('A full source commit SHA is required')
    const output = `tag=${release.tag}\nversion_name=${release.versionName}\nversion_code=${release.versionCode}\npublish=${publish}\nsource_ref=${sourceRef}\n`
    const outputPath = process.env.GITHUB_OUTPUT
    if (!outputPath) throw new Error('GITHUB_OUTPUT is required')
    await Bun.write(outputPath, (await Bun.file(outputPath).text()) + output)
    console.log(
      `Android ${release.versionName} (${release.versionCode}), ${publish ? 'publish' : 'artifact only'}`
    )
  } else if (command === 'verify') {
    const release = parseAndroidReleaseTag(
      process.env.ANDROID_RELEASE_TAG ?? ''
    )
    const apk = process.argv[3]
    const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT
    if (!apk || !sdk) throw new Error('APK path and Android SDK are required')
    const aapt = join(sdk, 'build-tools/35.0.0/aapt2')
    const dump = (args: string[]) => {
      const result = Bun.spawnSync([aapt, 'dump', ...args], {
        stdout: 'pipe',
        stderr: 'inherit'
      })
      if (result.exitCode !== 0)
        throw new Error('Unable to inspect release APK')
      return result.stdout.toString()
    }
    verifyAndroidReleaseManifest(
      dump(['badging', apk]),
      dump(['xmltree', apk, '--file', 'AndroidManifest.xml']),
      release
    )
    console.log(
      `Verified production APK: ${release.versionName} (${release.versionCode})`
    )
  } else throw new Error(`Unknown Android release command: ${command}`)
}
