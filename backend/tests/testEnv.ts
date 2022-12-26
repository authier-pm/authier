import 'reflect-metadata'
import faker from 'faker'
import 'dotenv/config'
import { afterAll, beforeAll, vi } from 'vitest'
import debug from 'debug'

faker.seed(1)

export const log = debug('au:test')
console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
beforeAll(() => {})

const fakeMailjetPost = {
  request: vi.fn()
}
console.log('mocked mailjet post')
// we don't want to send anything from tests.
vi.mock('node-mailjet', () => ({
  default: {
    apiConnect: () => {
      return {
        post: () => {
          return fakeMailjetPost
        }
      }
    }
  }
}))
console.log('mocked mailjet post')
vi.mock('webextension-polyfill', () => {
  const storage = {
    local: {
      get: () => {
        return Promise.resolve({})
      },
      set: (key, val) => {
        storage[key] = val
        return Promise.resolve({})
      }
    }
  }
  return {
    default: {
      storage,
      runtime: {
        sendMessage: () => {
          return Promise.resolve()
        }
      }
    },
    browser: {
      runtime: {
        sendMessage: () => {
          return Promise.resolve()
        }
      }
    }
  }
})
