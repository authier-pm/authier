import { RootResolver } from './RootResolver'

describe('RootResolver', () => {
  it('should work', async () => {
    const resolver = new RootResolver()
    expect(() => {
      resolver.me({ request: { headers: {} } } as any)
    }).toThrowErrorMatchingInlineSnapshot(`"You are missing a token"`)
  })
})
