import 'reflect-metadata'
import faker from 'faker'
import 'dotenv/config'
import { afterAll, beforeAll, vi } from 'vitest'
import debug from 'debug'

faker.seed(1)

export const log = debug('au:test')

// beforeAll(() => {})

const fakeMailjetPost = {
  request: vi.fn()
}

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
// TODO make a better mock for this or try mockzilla
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
