import faker from 'faker'

export const makeAddNewDeviceInput = () => ({
  email: faker.internet.email(),
  deviceName: faker.internet.userName(),
  devicePlatform: faker.internet.domainWord(),
  deviceId: faker.datatype.uuid(),
  firebaseToken: faker.datatype.uuid(),
  addDeviceSecret: faker.datatype.string(5),
  addDeviceSecretEncrypted: faker.datatype.string(5),
  decryptionChallengeId: faker.datatype.number(),
  deviceRecoveryCooldownMinutes: faker.datatype.number(),
  encryptionSalt: faker.datatype.string(5)
})

export const makeRegisterAccountInput = () => ({
  ...makeAddNewDeviceInput(),
  encryptionSalt: faker.datatype.string(5)
})
