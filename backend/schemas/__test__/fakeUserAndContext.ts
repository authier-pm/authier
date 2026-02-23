import { db } from '../../prisma/prismaClient'
import { faker } from '@faker-js/faker'
import type { RegisterNewAccountInput } from '../../models/AuthInputs'
import { makeRegisterAccountInput } from './makeRegisterAccountInput'
import * as schema from '../../drizzle/schema'

export const fakeUserAndContext = async () => {
  const userId = crypto.randomUUID()

  const fakeCtx = {
    reply: { setCookie: () => {} },
    request: { headers: {} },
    db,
    jwtPayload: { userId: userId },
    getIpAddress: () => faker.internet.ip()
  } as any

  const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
  const [user] = await db
    .insert(schema.user)
    .values({
      id: userId,
      email: fakeData.email,
      addDeviceSecret: fakeData.addDeviceSecret,
      addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
      encryptionSalt: fakeData.encryptionSalt,
      TOTPlimit: 5,
      loginCredentialsLimit: 5,
      deviceRecoveryCooldownMinutes: 50
    })
    .returning()

  return { fakeCtx, user }
}
