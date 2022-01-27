import { prismaClient } from '../prisma/prismaClient'

import faker, { fake } from 'faker'
import {
  AddNewDeviceInput,
  RegisterNewAccountInput
} from '../models/AuthInputs'
import { GraphQLResolveInfo } from 'graphql'
import {
  makeAddNewDeviceInput,
  makeRegisterAccountInput
} from '../schemas/RootResolver.spec'
import { sign } from 'jsonwebtoken'
import { DecryptionChallengeApproved } from './DecryptionChallenge'

const userSecurityProps = {
  deviceRecoveryCooldownMinutes: 960,
  loginCredentialsLimit: 50,
  TOTPlimit: 4
}
describe('DecryptionChallenge', () => {
  let challenge = new DecryptionChallengeApproved()

  describe('addNewDeviceForUser', () => {
    let userId = faker.datatype.uuid()
    let fakeCtx = {
      reply: { setCookie: jest.fn() },
      request: { headers: {} },
      prisma: prismaClient,
      jwtPayload: { userId: userId },
      getIpAddress: () => faker.internet.ip()
    } as any
    it('should add new device for user', async () => {
      let input: RegisterNewAccountInput = makeRegisterAccountInput()

      await prismaClient.user.create({
        data: {
          id: userId,
          email: input.email,
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: input.encryptionSalt,
          loginCredentialsLimit: 50,
          TOTPlimit: 4,
          deviceRecoveryCooldownMinutes: 960
        }
      })

      let data = await challenge.addNewDeviceForUser(
        {
          ...input,
          decryptionChallengeId: faker.datatype.number()
        },
        input.addDeviceSecret,
        fakeCtx,
        {} as GraphQLResolveInfo
      )

      const accessToken = sign(
        { userId: userId, deviceId: input.deviceId },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: '60m'
        }
      )

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: accessToken, email: input.email })
    })

    it("should show 'User not found'", async () => {
      let input: AddNewDeviceInput = makeAddNewDeviceInput()

      await expect(async () => {
        await challenge.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx,
          {} as GraphQLResolveInfo
        )
      }).rejects.toThrow('User not found')
    })

    it("should show 'Wrong master password used'", async () => {
      let userId = faker.datatype.uuid()

      let input = makeAddNewDeviceInput()

      await prismaClient.user.create({
        data: {
          id: userId,
          email: input.email,
          addDeviceSecret: faker.datatype.string(5),
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: faker.datatype.string(5),
          ...userSecurityProps
        }
      })

      expect(async () => {
        await challenge.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx,
          {} as GraphQLResolveInfo
        )
      }).rejects.toThrow('Wrong master password used')
    })
  })
})
