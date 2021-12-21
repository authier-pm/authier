import { prismaClient } from '../prismaClient'
import { RootResolver } from './RootResolver'

describe('RootResolver', () => {
  describe('me', () => {
    it('should return current user', async () => {
      const user = await prismaClient.user.create({
        data: {
          email: 'test@example.com',
          addDeviceSecret: 'test',
          addDeviceSecretEncrypted: '',
          TOTPlimit: 0,
          loginCredentialsLimit: 0
        }
      })

      const resolver = new RootResolver()
      expect(
        await resolver.me({
          request: { headers: {} },
          jwtPayload: { userId: user.id }
        } as any)
      ).toMatchObject(user)
    })
  })

  describe('logout', () => {
    it('should clear both cookies', async () => {})
    it('should increment tokenVersion for the current user', async () => {})
  })
})
