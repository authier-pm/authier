import { mock as mockDate, unmock } from 'proxy-date'
// import 'mockzilla-webextension' // does not work for some reason
jest.mock('@firebase/messaging') // doesn't work in JEST
jest.mock('webextension-polyfill-ts') // doesn't work in JEST

// @ts-expect-error
window.BroadcastChannel = function BroadcastChannel(name) {}

global.beforeAll(async () => {
  mockDate('2037-03-03T13:33:33.333Z')
})

global.afterAll(() => {
  unmock()
})
