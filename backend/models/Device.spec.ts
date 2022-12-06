import { prismaClient } from '../prisma/prismaClient'
import { RegisterNewAccountInput } from '../models/AuthInputs'
import { makeRegisterAccountInput } from '../schemas/RootResolver.spec'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { User } from '.prisma/client'
import faker from 'faker'
import { beforeAll, describe, it } from 'vitest'

describe('Device', () => {
  let user: User

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  challenge.deviceId = faker.datatype.uuid()
  challenge.deviceName = faker.random.word()
  const userId = faker.datatype.uuid()
  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeAll(async () => {
    user = await prismaClient.user.create({
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
  })

  it.todo('logout')
})
