#!/usr/bin/env bash
set -euo pipefail

: "${ANDROID_RELEASE_TAG:?Android tag is required}"
: "${ANDROID_VERSION_NAME:?Android version is required}"
: "${ANDROID_SOURCE_REF:?Source SHA is required}"
: "${GH_REPO:?GitHub repository is required}"

remote_commit=$(git ls-remote origin "refs/tags/$ANDROID_RELEASE_TAG" "refs/tags/$ANDROID_RELEASE_TAG^{}" |
  awk 'NR == 1 {sha = $1} /\^\{\}$/ {sha = $1} END {print sha}')
if [[ "$remote_commit" != "$ANDROID_SOURCE_REF" ]]; then
  echo 'The remote tag no longer points to the commit that was built. Refusing to publish.' >&2
  exit 1
fi

apk="authier-${ANDROID_VERSION_NAME}-android.apk"
obtainium_url=$(bun "$(dirname "$0")/androidObtainium.ts")
notes=$(mktemp)
existing_dir=$(mktemp -d)
trap 'rm -f "$notes"; rm -rf "$existing_dir"' EXIT
cat > "$notes" <<EOF
Native Authier for Android ${ANDROID_VERSION_NAME}.

**[Set up automatic updates with Obtainium](${obtainium_url})** (recommended).
Install Obtainium, import this Authier configuration, then install or update Authier from Obtainium.
Keep background updates enabled. On Android 12+, eligible updates can install automatically;
on older Android versions, tap the update notification to install.
If Authier is already installed, update or reinstall it in place through Obtainium. Do not uninstall Authier.

Download **${apk}**, open it on Android 8 or newer, and allow installation from your browser when prompted.
This is a signed release build. Later releases signed with the same key update this app in place.

Includes encrypted passwords, TOTP codes, offline sync and native app Autofill. Browser passkeys are
preserved encrypted; Android passkey authentication is not implemented yet.

Package: \`dev.authier.android\`. SHA-256 checksum: attached \`SHA256SUMS\`.
Source: [${ANDROID_SOURCE_REF}](https://github.com/${GH_REPO}/commit/${ANDROID_SOURCE_REF}).
EOF

if gh release view "$ANDROID_RELEASE_TAG" --json isDraft,assets > "$existing_dir/release.json"; then
  for asset in "$apk" SHA256SUMS; do
    # Never replace a published binary with different bytes under the same version.
    if jq -e --arg name "$asset" '.assets[] | select(.name == $name)' "$existing_dir/release.json" > /dev/null; then
      gh release download "$ANDROID_RELEASE_TAG" --pattern "$asset" --dir "$existing_dir"
      if ! cmp -s "release-apk/$asset" "$existing_dir/$asset"; then
        echo "Release asset $asset already exists with different bytes. Publish a new version instead." >&2
        exit 1
      fi
    else
      gh release upload "$ANDROID_RELEASE_TAG" "release-apk/$asset"
    fi
  done
  if jq -e '.isDraft' "$existing_dir/release.json" > /dev/null; then
    gh release edit "$ANDROID_RELEASE_TAG" --draft=false --latest=false
  fi
else
  gh release create "$ANDROID_RELEASE_TAG" "release-apk/$apk" release-apk/SHA256SUMS \
    --verify-tag --title "Authier Android $ANDROID_VERSION_NAME" --notes-file "$notes" --latest=false
fi
