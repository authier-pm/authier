import { beforeAll, describe, expect, it } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { db } from '../prisma/prismaClient'
import { user, device, decryptionChallenge } from '../drizzle/schema'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { makeRegisterAccountInput } from '../schemas/__test__/makeRegisterAccountInput'
import { hashDeviceSecret } from '../utils/deviceSecretHash'
import { UserMutation } from './UserMutation'
import { DefaultDeviceSettingsMutation } from './DefaultDeviceSettings'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

// testEnv calls setupTestDb in beforeAll and closes its in-memory PGlite in afterAll.
describe('passkey creation defaults for new devices', () => {
  const userId = crypto.randomUUID()
  const existingDeviceId = crypto.randomUUID()
  const challengeDeviceId = crypto.randomUUID()
  const input = makeRegisterAccountInput()
  let actor: UserMutation
  let challenge: DecryptionChallengeApproved
  const context = () => makeFakeCtx({ userId, deviceId: existingDeviceId })

  beforeAll(async () => {
    const [account] = await db
      .insert(user)
      .values({
        id: userId,
        email: input.email,
        addDeviceSecret: await hashDeviceSecret(input.addDeviceSecret),
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        loginCredentialsLimit: 50,
        TOTPlimit: 4,
        deviceRecoveryCooldownMinutes: 960
      })
      .returning()
    actor = new UserMutation(account)
    await db.insert(device).values({
      id: existingDeviceId,
      userId,
      name: 'Existing browser',
      platform: 'test',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      ...defaultDeviceSettingSystemValues
    })
    const [row] = await db
      .insert(decryptionChallenge)
      .values({
        deviceId: challengeDeviceId,
        deviceName: 'New browser',
        userId,
        ipAddress: '127.0.0.1',
        approvedAt: new Date(),
        emailApprovedAt: new Date()
      })
      .returning()
    challenge = plainToInstance(DecryptionChallengeApproved, row)
  })

  const addApprovedDevice = async (name: string) => {
    const id = crypto.randomUUID()
    await db.insert(decryptionChallenge).values({
      userId,
      deviceId: id,
      deviceName: name,
      ipAddress: '127.0.0.1',
      approvedAt: new Date(),
      emailApprovedAt: new Date()
    })
    return actor.addDevice({ id, name, platform: 'test' }, null, context())
  }

  it('rejects legacy pairing without the configured approval', async () => {
    const id = crypto.randomUUID()
    await expect(
      actor.addDevice(
        { id, name: 'Unapproved pair', platform: 'test' },
        null,
        context()
      )
    ).rejects.toThrow('configured new-device approvals')
    expect(await db.query.device.findFirst({ where: { id } })).toBeUndefined()
  })

  it('applies the saved default through both enrollment paths without changing existing devices', async () => {
    const initial = await actor.defaultDeviceSettings(context())
    expect(initial.passkeyCreationVerificationRequired).toBe(true)
    const defaults = plainToInstance(DefaultDeviceSettingsMutation, initial)
    const config = {
      ...defaultDeviceSettingSystemValues,
      theme: 'dark',
      uiLanguage: 'en'
    }
    const saved = await defaults.update(
      { ...config, passkeyCreationVerificationRequired: false },
      context()
    )
    expect(saved.passkeyCreationVerificationRequired).toBe(false)
    defaults.id = saved.id

    // An older client updating other defaults must not reset this choice.
    const {
      passkeyCreationVerificationRequired: _verification,
      ...legacyConfig
    } = config
    const legacy = await defaults.update(legacyConfig, context())
    expect(legacy.passkeyCreationVerificationRequired).toBe(false)

    const added = await addApprovedDevice('Paired browser')
    expect(added.passkeyCreationVerificationRequired).toBe(false)
    await challenge.addNewDeviceForUser(input, input.addDeviceSecret, context())
    expect(
      await db.query.device.findFirst({ where: { id: challengeDeviceId } })
    ).toMatchObject({
      passkeyCreationVerificationRequired: false
    })
    expect(
      await db.query.device.findFirst({ where: { id: existingDeviceId } })
    ).toMatchObject({
      passkeyCreationVerificationRequired: true
    })

    await defaults.update(config, context())
    await challenge.addNewDeviceForUser(input, input.addDeviceSecret, context())
    expect(
      await db.query.device.findFirst({ where: { id: challengeDeviceId } })
    ).toMatchObject({
      passkeyCreationVerificationRequired: false
    })
    const later = await addApprovedDevice('Later browser')
    expect(later.passkeyCreationVerificationRequired).toBe(true)
    expect(
      await db.query.device.findFirst({ where: { id: added.id } })
    ).toMatchObject({
      passkeyCreationVerificationRequired: false
    })
  })
})
