import 'reflect-metadata'
import { faker } from '@faker-js/faker'
import 'dotenv/config'
import { afterAll, beforeAll, vi } from 'vitest'
import debug from 'debug'

faker.seed(1)
export const log = debug('au:test')

beforeAll(() => {
  const fakeMailjetPost = {
    request: vi.fn()
  }
  log('mocked mailjet post')
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
})
