import { beforeEach, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  getAccessToken,
  removeToken,
  setAccessToken
} from './accessTokenExtension'

beforeEach(() => vi.clearAllMocks())

it('stores JWTs only in memory-backed session storage', async () => {
  await setAccessToken('new-jwt')
  expect(browser.storage.session.set).toHaveBeenCalledWith({
    'access-token': 'new-jwt'
  })
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})

it('ignores and deletes persistent JWTs left by older releases', async () => {
  vi.mocked(browser.storage.local.get).mockResolvedValue({
    'access-token': 'old-jwt'
  })
  vi.mocked(browser.storage.session.get).mockResolvedValue({})
  expect(await getAccessToken()).toBeNull()
  expect(browser.storage.local.remove).toHaveBeenCalledWith('access-token')
})

it('clears the session token on logout', async () => {
  await removeToken()
  expect(browser.storage.session.remove).toHaveBeenCalledWith('access-token')
})
