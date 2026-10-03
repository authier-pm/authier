import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  gql
} from '@apollo/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { tokenRefresh } from './tokenRefresh'

const {
  getAccessToken,
  setAccessToken,
  resumeRememberedDevice,
  clearAndReload
} = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  resumeRememberedDevice: vi.fn(),
  clearAndReload: vi.fn()
}))
vi.mock('../util/accessTokenExtension', () => ({
  getAccessToken,
  setAccessToken
}))
vi.mock('@src/background/ExtensionDevice', () => ({
  device: { clearAndReload }
}))
vi.mock('@src/background/loginSession', () => ({
  resumeRememberedDevice,
  LoginSessionError: class extends Error {
    constructor(
      message: string,
      readonly retryable: boolean
    ) {
      super(message)
    }
  }
}))

const fetchMock = vi.fn<typeof fetch>()
const forward = vi.fn(
  () =>
    new Observable((observer) => {
      observer.next({ data: { value: 'synced' } })
      observer.complete()
    })
)
const client = new ApolloClient({
  cache: new InMemoryCache(),
  queryDeduplication: false,
  link: ApolloLink.from([tokenRefresh, new ApolloLink(forward)])
})
const query = () =>
  client.query({
    query: gql`
      query VaultStatus {
        value
      }
    `,
    fetchPolicy: 'network-only'
  })

beforeEach(() => {
  vi.clearAllMocks()
  getAccessToken.mockResolvedValue(null)
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each([500, 503, 429])(
  'preserves the vault and rejects every waiting request after HTTP %s, then allows retry',
  async (status) => {
    let finishRefresh!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve
        })
    )
    const requests = Promise.allSettled([query(), query(), query()])
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    finishRefresh(new Response('Backend unavailable', { status }))
    expect((await requests).map(({ status }) => status)).toEqual([
      'rejected',
      'rejected',
      'rejected'
    ])
    expect(resumeRememberedDevice).not.toHaveBeenCalled()
    expect(clearAndReload).not.toHaveBeenCalled()
    expect(forward).not.toHaveBeenCalled()

    fetchMock.mockResolvedValueOnce(
      Response.json({ accessToken: 'renewed-token' })
    )
    await expect(query()).resolves.toMatchObject({ data: { value: 'synced' } })
    expect(setAccessToken).toHaveBeenCalledWith('renewed-token')
  }
)

it('preserves the vault when the network cannot be reached', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  await expect(query()).rejects.toThrow('Failed to fetch')
  expect(resumeRememberedDevice).not.toHaveBeenCalled()
  expect(clearAndReload).not.toHaveBeenCalled()
})

it('resumes the remembered session when its refresh cookie has expired', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ ok: false }, { status: 401 }))
  resumeRememberedDevice.mockResolvedValueOnce(undefined)
  await expect(query()).resolves.toMatchObject({ data: { value: 'synced' } })
  expect(resumeRememberedDevice).toHaveBeenCalledTimes(1)
  expect(clearAndReload).not.toHaveBeenCalled()
})
