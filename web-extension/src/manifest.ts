import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { dir } from '../scripts/updateManifestVersion'

export async function getManifest() {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 2,
    name: pkg.displayName,
    version: pkg.version,
    description: pkg.description,
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
    permissions: [
      'activeTab',
      'storage',
      'tabs',
      'clipboardRead',
      'http://localhost',
      'https://127.0.0.1',
      'https://jj46btrl5p42gvqobutebxifr40ogwdt.lambda-url.eu-central-1.on.aws'
    ],
    web_accessible_resources: [
      {
        resources: ['*.png'],
        matches: ['<all_urls>']
      }
    ],
    content_security_policy:
      "script-src 'self' 'unsafe-eval'; https://www.googleapis.com https://js.stripe.com/v3 https://*.firebaseio.com; object-src 'self'"
  }

  return manifest
}
