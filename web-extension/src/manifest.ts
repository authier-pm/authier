import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { dir } from '../scripts/generateExtensionManifest'

declare module 'webextension-polyfill' {
  namespace Manifest {
    interface GeckoAndroidSpecificProperties {
      id?: string
    }
  }
}

export const manifestVersion = Number(process.env.MANIFEST_VERSION ?? 3)

const firefoxGeckoId = '{18c8ffa6-f17c-4d43-bfab-5dae503c8c31}'

function getFirefoxManifestV2(
  pkg: typeof PkgType
): Manifest.WebExtensionManifest {
  return {
    manifest_version: 2,
    name: pkg.displayName,
    version: pkg.version,
    description: 'Authier password manager firefox extension',
    homepage_url: pkg.homepage,
    browser_action: {
      default_icon: 'icon-16.png',
      default_popup: 'js/popup.html'
    },
    background: {
      page: 'js/backgroundPage.html',
      persistent: true
    },
    content_scripts: [
      {
        matches: ['*://*/*'],
        js: ['js/browser-polyfill.js', 'js/contentScript.js'],
        all_frames: true
      }
    ],
    icons: {
      '16': 'icon-16.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png'
    },
    permissions: [
      'tabs',
      'activeTab',
      'storage',
      'clipboardRead',
      'scripting',
      'http://*/',
      'https://*/',
      '<all_urls>'
    ],
    browser_specific_settings: {
      // from https://blog.mozilla.org/addons/2023/10/05/changes-to-android-extension-signing/
      gecko: {
        id: firefoxGeckoId,
        strict_min_version: '102.0'
      },
      gecko_android: {
        id: firefoxGeckoId,
        strict_min_version: '102.0'
      }
    },
    web_accessible_resources: ['icon-16.png'],
    content_security_policy:
      "script-src 'self' 'unsafe-eval'; https://www.googleapis.com https://js.stripe.com/v3 https://*.firebaseio.com; object-src 'self'"
  }
}

export async function getManifest() {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType

  if (manifestVersion === 2) {
    return getFirefoxManifestV2(pkg)
  }

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName,
    version: pkg.version,
    description: pkg.description,
    homepage_url: pkg.homepage,
    action: {
      default_icon: {
        16: 'icon-16.png',
        48: 'icon-48.png',
        128: 'icon-128.png'
      },
      default_popup: 'js/popup.html'
    },
    background: {
      service_worker: 'js/backgroundPage.js'
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        all_frames: true,
        js: ['js/browser-polyfill.js', 'js/contentScript.js']
      }
    ],
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png'
    },
    host_permissions: ['<all_urls>'],
    permissions: ['activeTab', 'storage', 'tabs', 'clipboardRead', 'scripting'],
    web_accessible_resources: [
      {
        resources: ['*.png'],
        matches: ['<all_urls>']
      }
    ]
  }

  return manifest
}
