import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from './package.json'
import { isDev, port, r } from './scripts/utils'

export async function getManifest() {
  const pkg = (await fs.readJSON(r('package.json'))) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 2,
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    browser_action: {
      default_icon: 'icon-16.png',
      default_popup: 'popup.html'
    },
    background: {
      scripts: ['js/backgroundPage.js'],
      persistent: true
    },
    icons: {
      '16': 'icon-16.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png'
    },
    permissions: [
      'tabs',
      'activeTab',
      'notifications',
      'storage',
      'http://*/',
      'https://*/',
      '<all_urls>'
    ],
    content_scripts: [
      {
        matches: ['*://*/*'],
        js: ['js/contentScript.js'],
        all_frames: true
      }
    ],
    web_accessible_resources: ['icon-16.png']
  }

  if (isDev) {
    // for content script, as browsers will cache them for each reload,
    // we use a background script to always inject the latest version
    // see src/background/contentScriptHMR.ts
    delete manifest.content_scripts
    manifest.permissions?.push('webNavigation')

    // this is required on dev for Vite script to load
    manifest.content_security_policy = `script-src \'self\' http://localhost:${port}; object-src \'self\'`
  }

  return manifest
}
