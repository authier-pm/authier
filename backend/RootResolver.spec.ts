import { RootResolver } from './RootResolver'

describe('RootResolver', () => {
  it('should work', async () => {
    const resolver = new RootResolver()
    expect(() => {
      resolver.me({ request: { headers: {} } } as any)
    }).toThrowErrorMatchingInlineSnapshot(`"You are missing a token"`)
  })

  describe('logout', () => {
    it('should clear both cookies', async () => {})
    it('should increment tokenVersion for the current user', async () => {})
  })
})
