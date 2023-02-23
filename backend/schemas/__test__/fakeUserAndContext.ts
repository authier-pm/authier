import { prismaClient } from '../../prisma/prismaClient'
import { faker } from '@faker-js/faker'
import { RegisterNewAccountInput } from '../../models/AuthInputs'
import { makeRegisterAccountInput } from './makeRegisterAccountInput'

export const fakeUserAndContext = async () => {
  const userId = faker.datatype.uuid()

  const fakeCtx = {
    reply: { setCookie: () => {} },
    request: { headers: {} },
    prisma: prismaClient,
    jwtPayload: { userId: userId },
    getIpAddress: () => faker.internet.ip()
  } as any

  const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
  const user = await prismaClient.user.create({
    data: {
      id: userId,
      email: fakeData.email,
      addDeviceSecret: fakeData.addDeviceSecret,
      addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
      encryptionSalt: fakeData.encryptionSalt,
      TOTPlimit: 5,
      loginCredentialsLimit: 5,
      deviceRecoveryCooldownMinutes: 50
    }
  })

  return { fakeCtx, user }
}
