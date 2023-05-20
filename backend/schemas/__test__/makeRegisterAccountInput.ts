import { faker } from '@faker-js/faker'

export const makeAddNewDeviceInput = () => ({
  email: faker.internet.email(),
  deviceName: faker.internet.userName(),
  devicePlatform: faker.internet.domainWord(),
  deviceId: faker.string.uuid(),
  firebaseToken: faker.string.uuid(),
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
