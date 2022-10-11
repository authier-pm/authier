import { expect, describe, it } from '@jest/globals'

import { device } from './Device'

describe('device', () => {
  it('should be defined', () => {
    expect(device).toBeDefined()
  })
})
