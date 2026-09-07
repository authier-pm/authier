import { test, expect, chromium, firefox, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { createHash, createPublicKey, verify } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { isPasskeyRequestMessage } from '../../src/passkeys/bridgeProtocol'
import { getPasskeyAssertion } from '../../src/passkeys/webauthn'
import {
  connectWithMaxRetries,
  findFreeTcpPort
} from '../../node_modules/web-ext/lib/firefox/remote.js'

let extensionPath: string
const testUrl = 'https://passkeys.example.test/account'
const fixtureContentScripts = [
  {
    matches: ['https://passkeys.example.test/*'],
    js: ['bridgeEntry.js'],
    run_at: 'document_start'
  },
  {
    matches: ['https://passkeys.example.test/*'],
    js: ['pageEntry.js'],
    run_at: 'document_start',
    world: 'MAIN'
  }
]

async function openTestPage(page: Page) {
  await page.route('https://passkeys.example.test/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: {
        'Content-Security-Policy':
          "default-src 'none'; script-src 'nonce-test'; frame-src 'self'"
      },
      body: '<!doctype html><title>Passkey interoperability test</title>'
    })
  )
  await page.goto(testUrl)
}

test.beforeAll(async () => {
  extensionPath = await mkdtemp(
    path.join(tmpdir(), 'authier-passkey-extension-')
  )
  execFileSync(
    'bun',
    [
      'build',
      'src/passkeys/pageEntry.ts',
      'src/passkeys/bridgeEntry.ts',
      'tests/passkeys/approvedTestBackground.ts',
      '--target=browser',
      '--format=iife',
      `--outdir=${extensionPath}`,
      '--entry-naming=[name].js'
    ],
    { cwd: path.resolve(__dirname, '../..') }
  )
  await writeFile(
    path.join(extensionPath, 'manifest.json'),
    JSON.stringify({
      manifest_version: 3,
      name: 'Authier test passkey provider',
      version: '1.0.0',
      background: { service_worker: 'approvedTestBackground.js' },
      host_permissions: ['https://passkeys.example.test/*'],
      content_scripts: fixtureContentScripts
    })
  )
  const firefoxPath = path.join(extensionPath, 'firefox')
  await mkdir(firefoxPath)
  await Promise.all(
    ['bridgeEntry.js', 'pageEntry.js', 'approvedTestBackground.js'].map(
      (file) =>
        copyFile(path.join(extensionPath, file), path.join(firefoxPath, file))
    )
  )
  await writeFile(
    path.join(firefoxPath, 'manifest.json'),
    JSON.stringify({
      manifest_version: 2,
      name: 'Authier Firefox test passkey provider',
      version: '1.0.0',
      background: { scripts: ['approvedTestBackground.js'], persistent: true },
      browser_specific_settings: {
        gecko: { id: 'passkey-test@authier.pm', strict_min_version: '128.0' }
      },
      permissions: ['https://passkeys.example.test/*'],
      content_scripts: fixtureContentScripts
    })
  )
})

test.afterAll(async () => {
  await rm(extensionPath, { recursive: true, force: true })
})

test('registers and authenticates through a Firefox MV2 addon', async () => {
  const port = await findFreeTcpPort()
  const context = await firefox.launchPersistentContext('', {
    executablePath: process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH,
    args: ['--start-debugger-server', String(port)],
    firefoxUserPrefs: {
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
      'devtools.chrome.enabled': true
    }
  })
  const remote = await connectWithMaxRetries({ port, maxRetries: 20 })
  await remote.installTemporaryAddon(path.join(extensionPath, 'firefox'), false)
  const page = await context.newPage()
  await openTestPage(page)
  const result = await page.evaluate(async () => {
    const created = (await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array([1, 2, 3]),
        rp: { name: 'Example', id: 'example.test' },
        user: {
          id: new Uint8Array([4, 5, 6]),
          name: 'alice',
          displayName: 'Alice'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
      }
    })) as PublicKeyCredential
    const signed = (await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([7, 8, 9]),
        rpId: 'example.test',
        allowCredentials: [{ type: 'public-key', id: created.rawId }]
      }
    })) as PublicKeyCredential
    return {
      createdId: created.id,
      signedId: signed.id,
      creationType:
        created.response instanceof AuthenticatorAttestationResponse,
      assertionType: signed.response instanceof AuthenticatorAssertionResponse,
      platformAvailable:
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    }
  })
  expect(result).toMatchObject({
    createdId: result.signedId,
    creationType: true,
    assertionType: true,
    platformAvailable: true
  })
  remote.disconnect()
  await context.close()
})

test('registers in a Chromium extension and signs with the same synced credential in Firefox', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    channel: 'chromium',
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  })
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  const page = await context.newPage()
  await openTestPage(page)
  const registered = await page.evaluate(async () => {
    const bytes = new Uint8Array([99, 1, 2, 3, 99])
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: bytes.subarray(1, 4),
        rp: { name: 'Example', id: 'example.test' },
        user: {
          id: new DataView(bytes.buffer, 1, 3),
          name: 'alice@example.test',
          displayName: 'Alice'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required'
        },
        extensions: { credProps: true }
      }
    })) as PublicKeyCredential
    const response = credential.response as AuthenticatorAttestationResponse
    return {
      id: credential.id,
      isCredential: credential instanceof PublicKeyCredential,
      isResponse: response instanceof AuthenticatorAttestationResponse,
      client: JSON.parse(new TextDecoder().decode(response.clientDataJSON)),
      transports: response.getTransports(),
      publicKeyAlgorithm: response.getPublicKeyAlgorithm(),
      publicKey: Array.from(new Uint8Array(response.getPublicKey()!)),
      flags: new Uint8Array(response.getAuthenticatorData())[32],
      extensionResults: credential.getClientExtensionResults(),
      json: credential.toJSON(),
      platformAvailable:
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    }
  })
  expect(registered).toMatchObject({
    isCredential: true,
    isResponse: true,
    transports: ['internal'],
    publicKeyAlgorithm: -7,
    flags: 93,
    platformAvailable: true,
    client: {
      type: 'webauthn.create',
      challenge: 'AQID',
      origin: 'https://passkeys.example.test',
      crossOrigin: false
    },
    extensionResults: { credProps: { rk: true } }
  })
  expect(registered.json).toMatchObject({
    id: registered.id,
    rawId: registered.id,
    type: 'public-key'
  })
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const frame = document.createElement('iframe')
        frame.src = '/frame'
        frame.onload = () => resolve()
        document.body.append(frame)
      })
  )
  const frame = page
    .frames()
    .find((candidate) => candidate.url().endsWith('/frame'))
  expect(
    await frame?.evaluate(() =>
      Function.prototype.toString.call(navigator.credentials.create)
    )
  ).toContain('[native code]')
  const passkey = await worker.evaluate(
    () => globalThis.authierPasskeyTestState
  )
  expect(passkey?.credentialId).toBe(registered.id)
  await context.close()
  if (!passkey) throw new Error('Missing registered test passkey')

  // Firefox uses the identical page hook and an automation binding in place of
  // its isolated bridge. Private key material stays in this test process.
  const firefoxBrowser = await firefox.launch({
    executablePath: process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH
  })
  const firefoxPage = await firefoxBrowser.newPage()
  await firefoxPage.exposeBinding(
    'approvedTestProvider',
    async ({ frame }, message: unknown) => {
      if (!isPasskeyRequestMessage(message) || message.operation !== 'get')
        throw new Error('Unexpected test message')
      return {
        status: 'ok',
        credential: await getPasskeyAssertion(
          passkey,
          message.options,
          new URL(frame.url()).origin,
          true
        )
      }
    }
  )
  await firefoxPage.addInitScript(() => {
    const provider = window as Window & {
      approvedTestProvider: (message: unknown) => Promise<unknown>
    }
    window.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (
        event.source !== window ||
        event.origin !== location.origin ||
        typeof event.data !== 'object' ||
        !event.data
      )
        return
      const data = event.data as Record<string, unknown>
      if (
        data.channel !== 'authier-webauthn-v1' ||
        data.source !== 'authier-page' ||
        data.type !== 'request'
      )
        return
      const message = data.message as { requestId: string }
      const reply = {
        channel: 'authier-webauthn-v1',
        source: 'authier-extension',
        requestId: message.requestId
      }
      window.postMessage({ ...reply, type: 'received' }, location.origin)
      void provider.approvedTestProvider(message).then((response) => {
        window.postMessage(
          { ...reply, type: 'response', response },
          location.origin
        )
      })
    })
  })
  await firefoxPage.addInitScript({
    path: path.join(extensionPath, 'pageEntry.js')
  })
  await openTestPage(firefoxPage)
  const authenticated = await firefoxPage.evaluate(async (id) => {
    const rawId = Uint8Array.from(
      atob(id.replace(/-/g, '+').replace(/_/g, '/')),
      (char) => char.charCodeAt(0)
    )
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([7, 8, 9]),
        rpId: 'example.test',
        allowCredentials: [{ type: 'public-key', id: rawId }],
        userVerification: 'required'
      }
    })) as PublicKeyCredential
    const response = credential.response as AuthenticatorAssertionResponse
    return {
      id: credential.id,
      isCredential: credential instanceof PublicKeyCredential,
      isResponse: response instanceof AuthenticatorAssertionResponse,
      client: JSON.parse(new TextDecoder().decode(response.clientDataJSON)),
      flags: new Uint8Array(response.authenticatorData)[32],
      authenticatorData: Array.from(new Uint8Array(response.authenticatorData)),
      clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
      signature: Array.from(new Uint8Array(response.signature)),
      userHandle: Array.from(new Uint8Array(response.userHandle!)),
      json: credential.toJSON()
    }
  }, registered.id)
  expect(authenticated).toMatchObject({
    id: registered.id,
    isCredential: true,
    isResponse: true,
    flags: 29,
    userHandle: [1, 2, 3],
    client: {
      type: 'webauthn.get',
      challenge: 'BwgJ',
      origin: 'https://passkeys.example.test'
    }
  })
  expect(authenticated.signature[0]).toBe(48)
  const signedData = Buffer.concat([
    Buffer.from(authenticated.authenticatorData),
    createHash('sha256')
      .update(Buffer.from(authenticated.clientDataJSON))
      .digest()
  ])
  expect(
    verify(
      'sha256',
      signedData,
      createPublicKey({
        key: Buffer.from(registered.publicKey),
        format: 'der',
        type: 'spki'
      }),
      Buffer.from(authenticated.signature)
    )
  ).toBe(true)
  expect(authenticated.json).toMatchObject({
    id: registered.id,
    type: 'public-key'
  })
  await firefoxBrowser.close()
})
