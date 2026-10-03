import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { dir } from '../scripts/extensionDir'

declare module 'webextension-polyfill' {
  namespace Manifest {
    interface GeckoAndroidSpecificProperties {
      id?: string
    }
  }
}

export const manifestVersion = Number(process.env.MANIFEST_VERSION ?? 3)

export interface ManifestOptions {
  /** origin of the Vite dev server the extension pages load their modules from during development */
  devServerOrigin?: string
}

const firefoxGeckoId = '{18c8ffa6-f17c-4d43-bfab-5dae503c8c31}'

const gmailContentScript = {
  matches: ['https://mail.google.com/mail/*'],
  js: ['js/browser-polyfill.js', 'js/gmailCodes.js'],
  run_at: 'document_idle' as const,
  all_frames: false
}

const googleMessagesContentScript = {
  matches: ['https://messages.google.com/web/*'],
  js: ['js/browser-polyfill.js', 'js/googleMessagesCodes.js'],
  run_at: 'document_idle' as const,
  all_frames: false
}

const passkeyContentScripts = [
  {
    matches: ['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*'],
    js: ['js/browser-polyfill.js', 'js/passkeyBridge.js'],
    run_at: 'document_start' as const,
    all_frames: false
  },
  {
    matches: ['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*'],
    js: ['js/passkeyPage.js'],
    run_at: 'document_start' as const,
    world: 'MAIN' as const,
    all_frames: false
  }
]

function getFirefoxManifestV2(
  pkg: typeof PkgType,
  { devServerOrigin }: ManifestOptions
): Manifest.WebExtensionManifest {
  const scriptSources = ["'self'", "'unsafe-eval'", devServerOrigin]
    .filter(Boolean)
    .join(' ')

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
      ...passkeyContentScripts,
      gmailContentScript,
      googleMessagesContentScript,
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
      'alarms',
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
        // Firefox 128 introduced MAIN-world manifest content scripts.
        strict_min_version: '128.0'
      },
      gecko_android: {
        id: firefoxGeckoId,
        strict_min_version: '128.0'
      }
    },
    web_accessible_resources: ['icon-16.png', 'icon-128.png'],
    content_security_policy: `script-src ${scriptSources}; https://www.googleapis.com https://js.stripe.com/v3 https://*.firebaseio.com; object-src 'self'`
  }
}

export async function getManifest(options: ManifestOptions = {}) {
  const pkg = (await fs.readJSON(dir('package.json'))) as typeof PkgType

  if (manifestVersion === 2) {
    return getFirefoxManifestV2(pkg, options)
  }

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    minimum_chrome_version: '111',
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
      ...passkeyContentScripts,
      gmailContentScript,
      googleMessagesContentScript,
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
      'alarms',
      'tabs',
      'clipboardRead',
      'scripting'
    ],
    web_accessible_resources: [
      {
        resources: ['*.png'],
        matches: ['<all_urls>']
      }
    ],
    ...(options.devServerOrigin && {
      content_security_policy: {
        extension_pages: `script-src 'self' ${options.devServerOrigin}; object-src 'self'`
      }
    })
  }

  return manifest
}

export async function writeExtensionManifest(options: ManifestOptions = {}) {
  const manifest = await getManifest(options)

  await fs.writeFile(
    dir('dist/manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  console.log(
    `written manifest.json v${manifest.manifest_version} with version ${manifest.version}`
  )
}
