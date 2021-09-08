// @ts-expect-error
import { mock as mockDate, unmock } from 'proxy-date'

import 'mockzilla-webextension' // does not work for some reason
jest.mock('@firebase/messaging') // doesn't work in JEST

import type { Browser } from 'webextension-polyfill'
import { deepMock } from 'mockzilla'
const [browser, mockBrowser, mockBrowserNode] = deepMock<Browser>(
  'browser',
  false
)
jest.mock('webextension-polyfill', () => ({ browser }))

// @ts-expect-error
window.BroadcastChannel = function BroadcastChannel(name) {}

global.beforeAll(async () => {
  mockBrowserNode.enable()
  mockDate('2037-03-03T13:33:33.333Z')
})

global.afterAll(() => {
  unmock()
})
