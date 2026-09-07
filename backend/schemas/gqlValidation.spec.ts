import { beforeAll, describe, expect, it } from 'vitest'
import { graphql, isInputObjectType } from 'graphql'
import {
  Arg,
  buildSchemaSync,
  Field,
  InputType,
  Query,
  Resolver
} from 'type-graphql'
import type { ClassType } from 'type-graphql'
import { IsNotEmpty } from 'class-validator'
import { gqlSchema, graphqlValidationOptions } from './gqlSchema'
import {
  AddNewDeviceInput,
  ChangeMasterPasswordInput,
  RegisterNewAccountInput
} from '../models/AuthInputs'
import { DeviceInput } from '../models/Device'
import {
  DefaultSettingsInput,
  EncryptedSecretInput,
  EncryptedSecretPatchInput,
  SettingsInput
} from '../models/models'
import { SecretUsageEventInput } from '../models/types/SecretUsageEventInput'
import { WebInputElement } from '../models/WebInputElement'
import { db } from '../prisma/prismaClient'
import { webInput } from '../drizzle/schema'

const id = 'f5327a4d-514c-49f1-b1a8-7625403474ef'
const enrollment = {
  addDeviceSecret: 'secret',
  addDeviceSecretEncrypted: 'encrypted',
  encryptionSalt: 'salt',
  devicePlatform: 'test',
  firebaseToken: null
}
const secret = { encrypted: 'ciphertext', kind: 'LOGIN_CREDENTIALS' }
const deviceSettings = {
  syncTOTP: true,
  autofillTOTPEnabled: true,
  vaultLockTimeoutSeconds: 300
}
const inputs = [
  { type: AddNewDeviceInput, input: enrollment },
  {
    type: RegisterNewAccountInput,
    input: {
      ...enrollment,
      deviceId: id,
      deviceName: 'test',
      email: 'test@example.com'
    }
  },
  {
    type: ChangeMasterPasswordInput,
    input: {
      secrets: [{ ...secret, id }],
      addDeviceSecret: 'secret',
      addDeviceSecretEncrypted: 'encrypted',
      decryptionChallengeId: 1
    }
  },
  { type: DeviceInput, input: { id, name: 'test', platform: 'test' } },
  {
    type: DefaultSettingsInput,
    input: { ...deviceSettings, uiLanguage: 'en', theme: 'dark' }
  },
  {
    type: SettingsInput,
    input: {
      ...deviceSettings,
      uiLanguage: 'en',
      notificationOnVaultUnlock: false,
      notificationOnWrongPasswordAttempts: 3
    }
  },
  { type: EncryptedSecretInput, input: secret },
  { type: EncryptedSecretPatchInput, input: { ...secret, id } },
  { type: SecretUsageEventInput, input: { kind: 'AUTOFILL', secretId: id } },
  {
    type: WebInputElement,
    input: {
      domPath: '#password',
      domOrdinal: 0,
      url: 'https://example.com/login',
      kind: 'PASSWORD'
    }
  }
]

// Exercise TypeGraphQL conversion and validation for every production input
// class without running registration, email, or password-rotation side effects.
function inputSchema(type: ClassType<object>, list = false) {
  @Resolver()
  class InputValidationResolver {
    @Query(() => Boolean)
    acceptsInput(@Arg('input', () => (list ? [type] : type)) _input: unknown) {
      return true
    }
  }
  return buildSchemaSync({
    resolvers: [InputValidationResolver],
    validate: graphqlValidationOptions
  })
}

@InputType()
class ConstrainedInput {
  @Field(() => String)
  @IsNotEmpty()
  value: string
}

describe('GraphQL argument validation compatibility', () => {
  it('covers every input object reachable from the production schema', () => {
    const names = Object.values(gqlSchema.getTypeMap())
      .filter(isInputObjectType)
      .map((type) => type.name)
    expect(inputs.map(({ type }) => type.name).sort()).toEqual(names.sort())
  })

  for (const { type, input } of inputs) {
    it.each([false, true])(`accepts ${type.name} (list: %s)`, async (list) => {
      const argumentType = list ? `[${type.name}!]!` : `${type.name}!`
      const result = await graphql({
        schema: inputSchema(type, list),
        source: `query($input: ${argumentType}) { acceptsInput(input: $input) }`,
        variableValues: { input: list ? [input, input] : input }
      })
      expect(result.errors).toBeUndefined()
      expect(result.data).toEqual({ acceptsInput: true })
    })
  }

  it('still enforces explicit class-validator constraints', async () => {
    const result = await graphql({
      schema: inputSchema(ConstrainedInput),
      source: 'query { acceptsInput(input: { value: "" }) }'
    })
    expect(result.errors?.[0].message).toBe('Argument Validation Error')
  })

  it.each([
    { ...secret, kind: 'INVALID' },
    { kind: 'LOGIN_CREDENTIALS' },
    { ...secret, extra: true }
  ])('still rejects malformed input objects: %j', async (input) => {
    const result = await graphql({
      schema: inputSchema(EncryptedSecretInput),
      source:
        'query($input: EncryptedSecretInput!) { acceptsInput(input: $input) }',
      variableValues: { input }
    })
    expect(result.errors).toHaveLength(1)
    expect(result.data).toBeUndefined()
  })

  it.each([
    { type: AddNewDeviceInput, input: { ...enrollment, addDeviceSecret: '' } },
    {
      type: EncryptedSecretPatchInput,
      input: { ...secret, id: 'invalid-uuid' }
    },
    {
      type: ChangeMasterPasswordInput,
      input: {
        secrets: [{ ...secret, id: 'invalid-uuid' }],
        addDeviceSecret: 'secret',
        addDeviceSecretEncrypted: 'encrypted',
        decryptionChallengeId: 1
      }
    },
    {
      type: WebInputElement,
      input: {
        domPath: '#password',
        domOrdinal: -1,
        url: 'https://example.com',
        kind: 'PASSWORD'
      }
    }
  ])('still enforces custom scalars in $type.name', async ({ type, input }) => {
    const result = await graphql({
      schema: inputSchema(type),
      source: `query($input: ${type.name}!) { acceptsInput(input: $input) }`,
      variableValues: { input }
    })
    expect(result.errors).toHaveLength(1)
    expect(result.data).toBeUndefined()
  })
})

describe('webInputsForHosts', () => {
  // testEnv creates PGlite in beforeAll and closes it in afterAll.
  beforeAll(async () => {
    await db.insert(webInput).values([
      {
        host: 'example.com',
        url: 'https://example.com/login',
        domPath: '#password',
        kind: 'PASSWORD'
      },
      {
        host: 'other.test',
        url: 'https://other.test/login',
        domPath: '#password',
        kind: 'PASSWORD'
      }
    ])
  })

  const query = (variables: Record<string, unknown>) =>
    graphql({
      schema: gqlSchema,
      source: `query webInputsForHosts($hosts: [String!]) {
      webInputs(hosts: $hosts) { id host url domPath domOrdinal kind createdAt __typename }
    }`,
      variableValues: variables,
      contextValue: { db }
    })

  it('returns matching selectors for a nonempty string list', async () => {
    const result = await query({ hosts: ['www.example.com', 'missing.test'] })
    expect(result.errors).toBeUndefined()
    expect(result.data).toEqual({
      webInputs: [
        expect.objectContaining({ host: 'example.com', domPath: '#password' })
      ]
    })
  })

  it.each([{ hosts: [] }, { hosts: null }, {}])(
    'accepts optional or empty hosts: %j',
    async (variables) => {
      const result = await query(variables)
      expect(result.errors).toBeUndefined()
      expect(result.data).toEqual({ webInputs: [] })
    }
  )

  it.each([[123], [null]])(
    'rejects malformed host lists: %j',
    async (...hosts) => {
      const result = await query({ hosts })
      expect(result.errors).toHaveLength(1)
      expect(result.data).toBeUndefined()
    }
  )
})
