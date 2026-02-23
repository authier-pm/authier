import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  device: {
    users: r.many.user({
      from: r.device.id.through(r.decryptionChallenge.approvedFromDeviceId),
      to: r.user.id.through(r.decryptionChallenge.userId),
      alias: 'device_id_user_id_via_decryptionChallenge'
    }),
    user: r.one.user({
      from: r.device.userId,
      to: r.user.id,
      alias: 'device_userId_user_id'
    }),
    secretUsageEvents: r.many.secretUsageEvent(),
    decryptionChallenges: r.many.decryptionChallenge({
      from: r.device.id.through(r.user.masterDeviceId),
      to: r.decryptionChallenge.id.through(r.user.recoveryDecryptionChallengeId)
    })
  },
  user: {
    devicesViaDecryptionChallenge: r.many.device({
      alias: 'device_id_user_id_via_decryptionChallenge'
    }),
    defaultSettings: r.one.defaultSettings(),
    devicesUserId: r.many.device({
      alias: 'device_userId_user_id'
    }),
    emailVerifications: r.many.emailVerification(),
    encryptedSecrets: r.many.encryptedSecret(),
    masterDeviceChanges: r.many.masterDeviceChange(),
    secretUsageEvents: r.many.secretUsageEvent(),
    tags: r.many.tag(),
    tokens: r.many.token(),
    userPaidProducts: r.many.userPaidProducts(),
    webInputs: r.many.webInput()
  },
  defaultSettings: {
    user: r.one.user({
      from: r.defaultSettings.userId,
      to: r.user.id
    })
  },
  emailVerification: {
    user: r.one.user({
      from: r.emailVerification.userId,
      to: r.user.id
    })
  },
  encryptedSecret: {
    user: r.one.user({
      from: r.encryptedSecret.userId,
      to: r.user.id
    }),
    secretUsageEvents: r.many.secretUsageEvent()
  },
  masterDeviceChange: {
    user: r.one.user({
      from: r.masterDeviceChange.userId,
      to: r.user.id
    })
  },
  secretUsageEvent: {
    device: r.one.device({
      from: r.secretUsageEvent.deviceId,
      to: r.device.id
    }),
    encryptedSecret: r.one.encryptedSecret({
      from: r.secretUsageEvent.secretId,
      to: r.encryptedSecret.id
    }),
    user: r.one.user({
      from: r.secretUsageEvent.userId,
      to: r.user.id
    }),
    webInput: r.one.webInput({
      from: r.secretUsageEvent.webInputId,
      to: r.webInput.id
    })
  },
  webInput: {
    secretUsageEvents: r.many.secretUsageEvent(),
    user: r.one.user({
      from: r.webInput.addedByUserId,
      to: r.user.id
    })
  },
  tag: {
    user: r.one.user({
      from: r.tag.userId,
      to: r.user.id
    })
  },
  token: {
    user: r.one.user({
      from: r.token.userId,
      to: r.user.id
    })
  },
  decryptionChallenge: {
    devices: r.many.device()
  },
  userPaidProducts: {
    user: r.one.user({
      from: r.userPaidProducts.userId,
      to: r.user.id
    })
  }
}))
