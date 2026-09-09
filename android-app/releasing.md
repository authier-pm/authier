# Android releases

Pushing a tag such as `v0.1.0-android` runs `.github/workflows/android_build.yml`:

1. Validate the tag and derive `versionName` and `versionCode`.
2. Run native tests, debug/release lint, API/migration checks, web sync tests and code-generation checks.
3. Build the native release variant and verify its package, version, disabled debugging/backups/cleartext, and absence of preview activities.
4. Confirm production exposes the required `/api/v1` contract.
5. Sign using the existing GitHub Actions Android signing secrets and verify the APK signature.
6. Attach `authier-<version>-android.apk` and `SHA256SUMS` to the tag's GitHub Release.

The release also appears as an Actions artifact. The previous React Native/Google Play tag workflow is replaced; Android tags no longer upload that app to Play. Extension release asset jobs only handle `-extension` tags. Android releases do not replace the repository's latest extension release.

## Publish

### Obtainium updates

The download page and release notes offer a preconfigured Obtainium import link.
`shared/androidDistribution.ts` owns the configuration; `scripts/androidObtainium.ts`
prints the link used by the publisher. Keep release titles in the form
`Authier Android <version>` and APK names `authier-<version>-android.apk`.
Obtainium filters those titles/assets, skips prereleases, searches older releases
when a newer extension release exists, and trims `v<version>-android` to match
the installed Android version. Update and test the configuration if these conventions change.

Users must install Authier through Obtainium and leave background updates enabled.
Android 12+ can install eligible updates silently; earlier Android versions need
confirmation. No Authier APK rebuild is needed to start using Obtainium.

Validate with `bun test scripts/androidObtainium.spec.ts scripts/androidRelease*.spec.ts`.

### Create a release tag

The workflow and native app changes must be pushed to the commit you tag. To publish a version, choose a version higher than previous Android releases:

```sh
git tag -a v0.1.0-android -m 'Authier Android 0.1.0'
git push origin v0.1.0-android
```

Publishing an Android release manually through GitHub also triggers the build. Re-running uploads missing assets but refuses to overwrite an existing asset with different bytes. Use a new version for changed builds; do not move published tags.

To test signing without publishing a tag or release, manually run **Android release** against a branch, set **version**, and leave **publish** unchecked. Download the signed APK from the run's `authier-android-release-<version>` artifact. To retry an existing tag's publication, select that tag and enable **publish**. Publication is rejected for branch refs.

Version codes are deterministic: `major × 1,000,000 + minor × 1,000 + patch`. Minor and patch must be 0–999; major must be 0–2099. `0.0.0`, leading zeroes and prerelease suffixes are rejected. For example, `v1.2.3-android` gives version name `1.2.3` and code `1002003`. Re-runs use the same code, and higher semantic versions produce higher codes.

## Signing and installation

GitHub Actions uses the existing repository secrets `ANDROID_SIGNING_KEY` (Base64 keystore), `ANDROID_ALIAS`, `ANDROID_KEY_STORE_PASSWORD` and `ANDROID_KEY_PASSWORD`. They are needed only in the signing job, after checks succeed. The temporary keystore is removed when signing finishes. No private key or password is attached to the release.

Keep using the same signing key for updates. Android requires the same package and signing certificate plus a suitable version code to install an update. Release APKs use `dev.authier.android`; debug builds use `dev.authier.android.debug`. Neither is the legacy React Native package `com.authier`.

The first development APK shared before the release workflow used `dev.authier.android` with a debug key. If installed, synchronize its pending changes and uninstall that development build before installing the first production-signed APK. Later release updates install in place without removing the local vault. Uninstalling clears that installation's local vault.

On Android 8+, download and open the `.apk` asset, allow installation from the downloading app when Android requests it, then sign into Authier. This is a release APK signed for direct distribution; Google Play registration is not required for this installation path.

## Backend prerequisite

The production API and its migrations must be deployed before publishing. The release job fails if `https://api.authier.pm/api/v1/openapi.json` is missing required native endpoints or the `PASSKEY` record format. This contract check does not prove database migration state or replace an authenticated production smoke test.

Follow [the API rollout notes](../backend/orpc/README.md): pause vault writes across the initial change-log migration and API handoff, and use `pnpm wrdeploy` from `backend` so failed migrations abort deployment. Cloudflare Workers Builds must retain `pnpm run db:migrate && npx wrangler deploy` and a production `DATABASE_URL` build secret. The APK tag job deliberately does not migrate a production database or change the server deployment.

## Local release verification

```sh
cd android-app
./gradlew :app:testDebugUnitTest :app:lintRelease :app:assembleRelease \
  -PauthierVersionName=0.1.0 -PauthierVersionCode=1000
```

This produces an unsigned release APK for inspection. Actual publishing uses `apksigner sign` followed by `apksigner verify`; an unsigned APK is not an installable release asset.

References: [Android signing](https://developer.android.com/studio/publish/app-signing), [apksigner](https://developer.android.com/tools/apksigner), [GitHub release creation](https://cli.github.com/manual/gh_release_create), [workflow event behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
