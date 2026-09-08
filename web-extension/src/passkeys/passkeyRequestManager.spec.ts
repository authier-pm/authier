import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PasskeyRequestManager,
  type PasskeyRepository,
  type PasskeySender,
  type PasskeyWindows
} from './passkeyRequestManager'
import { createPasskey, type PasskeyCreationOptions } from './webauthn'
import type { PasskeyData } from '@shared/passkeySchema'

const options: PasskeyCreationOptions = {
  challenge: 'Y2hhbGxlbmdl',
  rp: { id: 'example.com', name: 'Example' },
  user: { id: 'dXNlcg', name: 'alex@example.com', displayName: 'Alex' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
  authenticatorSelection: { userVerification: 'required' }
}
const website: PasskeySender = {
  id: 'extension',
  frameId: 0,
  url: 'https://example.com/login',
  tab: { id: 7 }
}
let manager: PasskeyRequestManager
let repository: PasskeyRepository
let windows: PasskeyWindows
let session: object | null
let passkeys: PasskeyData[]
let token: string
const approval = (): PasskeySender => ({
  id: 'extension',
  url: windows.approvalUrl(token)
})
const start = () =>
  manager.begin({ requestId: 'request', operation: 'create', options }, website)

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto)
  session = {}
  passkeys = []
  token = ''
  repository = {
    initialize: async () => undefined,
    identity: () => 'user:salt',
    session: () => session,
    verifyPassword: vi.fn(async (password: string) => {
      if (password !== 'correct')
        throw new DOMException('Incorrect master password.', 'NotAllowedError')
      session ??= {}
      return session
    }),
    list: vi.fn(async () => passkeys),
    save: vi.fn(async (passkey) => {
      passkeys.push(passkey)
    })
  }
  windows = {
    extensionId: 'extension',
    approvalUrl: (id) =>
      `chrome-extension://extension/js/passkey.html?request=${id}`,
    open: vi.fn(async (id) => {
      token = id
      return 10
    }),
    close: vi.fn(async () => undefined),
    isCurrentTab: vi.fn(async () => true)
  }
  manager = new PasskeyRequestManager(repository, windows)
})
afterEach(() => {
  manager.cancelTab(7)
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
const opened = async () => {
  await vi.waitFor(() => expect(token).not.toBe(''))
}
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('trusted passkey ceremonies', () => {
  it('saves only after password verification and explicit extension approval', async () => {
    const result = start()
    await opened()
    await expect(manager.approve(token, undefined, approval())).rejects.toThrow(
      'Verify your master password'
    )
    await expect(
      manager.verify(token, 'incorrect', approval())
    ).rejects.toThrow('Incorrect master password')
    expect(repository.save).not.toHaveBeenCalled()
    const view = await manager.verify(token, 'correct', approval())
    expect(view).toMatchObject({
      verified: true,
      origin: 'https://example.com',
      rpId: 'example.com'
    })
    await manager.approve(token, undefined, approval())
    expect(await result).toMatchObject({
      status: 'ok',
      credential: { type: 'public-key' }
    })
    expect(passkeys).toHaveLength(1)
    expect(JSON.stringify(view)).not.toContain('privateKey')
  })

  it('rejects forged approval and cross-origin/iframe requests', async () => {
    await expect(
      manager.begin(
        { requestId: 'x', operation: 'create', options },
        { ...website, frameId: 2 }
      )
    ).rejects.toThrow('top-level')
    await expect(
      manager.begin(
        { requestId: 'x', operation: 'create', options },
        { ...website, url: 'https://evil.example.net/' }
      )
    ).rejects.toThrow('domain')
    const result = start()
    await opened()
    await expect(manager.verify(token, 'correct', website)).rejects.toThrow(
      'Only the Authier'
    )
    await expect(
      manager.view(token, {
        id: 'another-extension',
        url: windows.approvalUrl(token)
      })
    ).rejects.toThrow('Only the Authier')
    await expect(
      manager.view(token, { ...approval(), frameId: 2 })
    ).rejects.toThrow('Only the Authier')
    manager.cancelTab(7)
    expect(await result).toMatchObject({ status: 'error' })
  })

  it('rejects approval if vault locks after verification', async () => {
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    session = null
    await expect(manager.approve(token, undefined, approval())).rejects.toThrow(
      'Verify your master password'
    )
    expect(repository.save).not.toHaveBeenCalled()
    manager.cancelTab(7)
    await result
  })

  it('does not return registration success if persistence fails', async () => {
    repository.save = vi.fn(async () => {
      throw new Error('offline')
    })
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    await expect(manager.approve(token, undefined, approval())).rejects.toThrow(
      'offline'
    )
    expect(await result).toMatchObject({
      status: 'error',
      name: 'NotAllowedError'
    })
  })

  it('rejects duplicate registrations without leaking existence before approval', async () => {
    const existing = await createPasskey(options, 'https://example.com', true)
    passkeys.push(existing.passkey)
    const result = manager.begin(
      {
        requestId: 'request',
        operation: 'create',
        options: {
          ...options,
          excludeCredentials: [
            { id: existing.passkey.credentialId, type: 'public-key' }
          ]
        }
      },
      website
    )
    await opened()
    await manager.verify(token, 'correct', approval())
    await expect(
      manager.approve(token, undefined, approval())
    ).rejects.toMatchObject({ name: 'InvalidStateError' })
    expect(repository.save).not.toHaveBeenCalled()
    expect(await result).toMatchObject({
      status: 'error',
      name: 'InvalidStateError'
    })
  })

  it('signs with the selected synced account and exposes no private key', async () => {
    passkeys.push(
      (await createPasskey(options, 'https://example.com', true)).passkey
    )
    const result = manager.begin(
      {
        requestId: 'request',
        operation: 'get',
        options: {
          challenge: 'bmV3LWNoYWxsZW5nZQ',
          rpId: 'example.com',
          userVerification: 'required'
        }
      },
      website
    )
    await opened()
    expect((await manager.view(token, approval())).accounts).toEqual([])
    const view = await manager.verify(token, 'correct', approval())
    expect(view.accounts).toHaveLength(1)
    expect(JSON.stringify(view)).not.toContain('privateKey')
    await manager.approve(token, view.accounts[0].credentialId, approval())
    const reply = await result
    expect(reply).toMatchObject({
      status: 'ok',
      credential: { id: passkeys[0].credentialId }
    })
    expect(JSON.stringify(reply)).not.toContain('privateKey')
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('falls back without a matching passkey or an Authier account', async () => {
    expect(
      await manager.begin(
        {
          requestId: 'x',
          operation: 'get',
          options: { challenge: 'Y2hhbGxlbmdl' }
        },
        website
      )
    ).toEqual({ status: 'fallback' })
    repository.identity = () => null
    expect(await start()).toEqual({ status: 'fallback' })
    expect(windows.open).not.toHaveBeenCalled()
  })

  it('cancels only requests owned by the requesting tab', async () => {
    const result = start()
    await opened()
    manager.cancel('request', { ...website, tab: { id: 99 } })
    expect((await manager.view(token, approval())).verified).toBe(false)
    manager.cancel('request', website)
    expect(await result).toMatchObject({ status: 'error', name: 'AbortError' })
  })

  it('blocks multiple approval windows in the same tab and cancels on close', async () => {
    const result = start()
    await opened()
    await expect(start()).rejects.toThrow('already open')
    manager.windowClosed(10)
    expect(await result).toMatchObject({
      status: 'error',
      name: 'NotAllowedError'
    })
    expect(windows.open).toHaveBeenCalledTimes(1)
  })

  it('invalidates the ceremony when the page navigates', async () => {
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    windows.isCurrentTab = async () => false
    await expect(manager.approve(token, undefined, approval())).rejects.toThrow(
      'website or vault changed'
    )
    expect(repository.save).not.toHaveBeenCalled()
    manager.cancelTab(7)
    await result
  })

  it('reserves the tab and honors aborts while the vault is initializing', async () => {
    const initialization = deferred<void>()
    repository.initialize = () => initialization.promise
    const result = start()
    await expect(start()).rejects.toThrow('already open')
    manager.cancel('request', website)
    expect(await result).toMatchObject({ status: 'error', name: 'AbortError' })
    initialization.resolve()
    await initialization.promise
    expect(windows.open).not.toHaveBeenCalled()
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('does not reopen an aborted assertion after a slow credential lookup completes', async () => {
    passkeys.push(
      (await createPasskey(options, 'https://example.com', true)).passkey
    )
    const listing = deferred<PasskeyData[]>()
    repository.list = vi.fn(() => listing.promise)
    const result = manager.begin(
      {
        requestId: 'request',
        operation: 'get',
        options: { challenge: options.challenge }
      },
      website
    )
    await vi.waitFor(() => expect(repository.list).toHaveBeenCalled())
    manager.cancel('request', website)
    expect(await result).toMatchObject({ status: 'error', name: 'AbortError' })
    listing.resolve(passkeys)
    await listing.promise
    expect(windows.open).not.toHaveBeenCalled()
  })

  it('rechecks vault identity when it changes during a tab lookup', async () => {
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    const tab = deferred<boolean>()
    windows.isCurrentTab = () => tab.promise
    const approving = manager.approve(token, undefined, approval())
    repository.identity = () => 'another-user:another-salt'
    tab.resolve(true)
    await expect(approving).rejects.toThrow('website or vault changed')
    expect(await result).toMatchObject({ status: 'error' })
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('does not treat another unlocked session as verified', async () => {
    const result = start()
    await opened()
    const originalSession = session!
    repository.verifyPassword = vi.fn(async () => {
      session = {}
      return originalSession
    })
    await expect(manager.verify(token, 'correct', approval())).rejects.toThrow(
      'Verify your master password again'
    )
    expect((await manager.view(token, approval())).verified).toBe(false)
    manager.dismiss(token, false, approval())
    await result
  })

  it('withholds account metadata if the vault locks during account lookup', async () => {
    passkeys.push(
      (await createPasskey(options, 'https://example.com', true)).passkey
    )
    const result = manager.begin(
      {
        requestId: 'request',
        operation: 'get',
        options: { challenge: options.challenge }
      },
      website
    )
    await opened()
    await manager.verify(token, 'correct', approval())
    repository.list = vi.fn(async () => {
      session = null
      return passkeys
    })
    expect(await manager.view(token, approval())).toMatchObject({
      verified: false,
      accounts: []
    })
    manager.dismiss(token, false, approval())
    await result
  })

  it('does not return a registration credential after locking during persistence', async () => {
    repository.save = vi.fn(async () => {
      session = null
    })
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    await expect(manager.approve(token, undefined, approval())).rejects.toThrow(
      'vault was locked'
    )
    expect(await result).toMatchObject({ status: 'error' })
  })

  it('does not return a credential after cancellation during persistence', async () => {
    const saving = deferred<void>()
    repository.save = vi.fn(() => saving.promise)
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    const approving = manager.approve(token, undefined, approval())
    await vi.waitFor(() => expect(repository.save).toHaveBeenCalled())
    manager.cancel('request', website)
    expect(await result).toMatchObject({ status: 'error', name: 'AbortError' })
    saving.resolve()
    await expect(approving).rejects.toThrow('website or vault changed')
  })

  it('expires verification while slow work is in flight', async () => {
    vi.useFakeTimers()
    const result = start()
    await opened()
    await manager.verify(token, 'correct', approval())
    const verifiedTime = Date.now()
    repository.list = vi.fn(async () => {
      vi.setSystemTime(verifiedTime + 60_001)
      return passkeys
    })
    await expect(manager.approve(token, undefined, approval())).rejects.toThrow(
      'verification expired'
    )
    expect(await result).toMatchObject({ status: 'error' })
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('times out initialization after the default two-minute ceremony lifetime', async () => {
    vi.useFakeTimers()
    const initialization = deferred<void>()
    repository.initialize = () => initialization.promise
    const result = start()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(await result).toMatchObject({
      status: 'error',
      name: 'NotAllowedError',
      message: expect.stringContaining('timed out')
    })
    initialization.resolve()
    await initialization.promise
    expect(windows.open).not.toHaveBeenCalled()
  })

  it('closes a late approval window when cancellation occurs during window creation', async () => {
    const opening = deferred<number>()
    windows.open = vi.fn((id) => {
      token = id
      return opening.promise
    })
    const result = start()
    await opened()
    manager.cancel('request', website)
    expect(await result).toMatchObject({ status: 'error', name: 'AbortError' })
    opening.resolve(10)
    await vi.waitFor(() => expect(windows.close).toHaveBeenCalledWith(10))
  })

  it('bounds otherwise unknown extension input data', async () => {
    await expect(
      manager.begin(
        {
          requestId: 'request',
          operation: 'create',
          options: {
            ...options,
            extensions: { futureExtension: 'x'.repeat(262_145) }
          }
        },
        website
      )
    ).rejects.toMatchObject({ name: 'DataError' })
    expect(windows.open).not.toHaveBeenCalled()
  })
})
