import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { dir } from '../scripts/generateExtensionManifest'

export async function getManifest() {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 2,
    name: pkg.displayName,
    version: pkg.version,
    description: 'Authier password manager firefox extension',
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
      'http://*/',
      'https://*/',
      '<all_urls>'
    ],
    browser_specific_settings: {
      // from https://blog.mozilla.org/addons/2023/10/05/changes-to-android-extension-signing/
      gecko: {
        id: '{18c8ffa6-f17c-4d43-bfab-5dae503c8c31}',
        strict_min_version: '90.0'
      },
      gecko_android: {
        // @ts-expect-error
        id: '{18c8ffa6-f17c-4d43-bfab-5dae503c8c31}',
        strict_min_version: '90.0'
      }
    },
    web_accessible_resources: ['icon-16.png'],
    content_security_policy:
      "script-src 'self' 'unsafe-eval'; https://www.googleapis.com https://js.stripe.com/v3 https://*.firebaseio.com; object-src 'self'"
  }

  return manifest
}
