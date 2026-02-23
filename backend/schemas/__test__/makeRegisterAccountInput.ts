import { faker } from '@faker-js/faker'

export const makeAddNewDeviceInput = () => ({
  email: `${crypto.randomUUID()}@test.com`,
  deviceName: faker.internet.username(),
  devicePlatform: faker.internet.domainWord(),
  deviceId: crypto.randomUUID(),
  firebaseToken: crypto.randomUUID(),
  addDeviceSecret: faker.string.sample(5),
  addDeviceSecretEncrypted: faker.string.sample(5),
  decryptionChallengeId: faker.number.int(),
  deviceRecoveryCooldownMinutes: faker.number.int(),
  encryptionSalt: faker.string.sample(5)
})

export const makeRegisterAccountInput = () => ({
  ...makeAddNewDeviceInput(),
  encryptionSalt: faker.string.sample(5)
})
