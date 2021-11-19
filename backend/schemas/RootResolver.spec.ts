import { RootResolver } from './RootResolver'

describe('RootResolver', () => {
  describe('me', () => {
    it('should return null', async () => {
      const resolver = new RootResolver()
      expect(
        await resolver.me({ request: { headers: {} } } as any)
      ).toBeUndefined()
    })
  })

  describe('logout', () => {
    it('should clear both cookies', async () => {})
    it('should increment tokenVersion for the current user', async () => {})
  })
})
