import {
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  serial,
  bigserial,
  uuid,
  text,
  inet,
  customType,
  integer,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
  type AnyPgColumn,
  primaryKey
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const tokenType = pgEnum('TokenType', ['EMAIL', 'API'])
export const encryptedSecretType = pgEnum('EncryptedSecretType', [
  'TOTP',
  'LOGIN_CREDENTIALS'
])
export const webInputType = pgEnum('WebInputType', [
  'TOTP',
  'USERNAME',
  'EMAIL',
  'USERNAME_OR_EMAIL',
  'PASSWORD',
  'NEW_PASSWORD',
  'NEW_PASSWORD_CONFIRMATION',
  'SUBMIT_BUTTON',
  'CUSTOM'
])
export const emailVerificationType = pgEnum('EmailVerificationType', [
  'PRIMARY',
  'CONTACT'
])
export const userNewDevicePolicy = pgEnum('UserNewDevicePolicy', [
  'ALLOW',
  'REQUIRE_ANY_DEVICE_APPROVAL',
  'REQUIRE_MASTER_DEVICE_APPROVAL'
])

export const prismaMigrations = pgTable('_prisma_migrations', {
  id: varchar({ length: 36 }).primaryKey(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  migrationName: varchar('migration_name', { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp('rolled_back_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  appliedStepsCount: integer('applied_steps_count').default(0).notNull()
})

export const decryptionChallenge = pgTable(
  'DecryptionChallenge',
  {
    id: serial().primaryKey(),
    ipAddress: inet().notNull(),
    approvedAt: timestamp({ precision: 3 }),
    userId: uuid()
      .notNull()
      .references((): AnyPgColumn => user.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    deviceId: text().notNull(),
    approvedFromDeviceId: text().references(() => device.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    masterPasswordVerifiedAt: timestamp({ precision: 3 }),
    blockIp: boolean(),
    rejectedAt: timestamp({ precision: 3 }),
    approvedByRecovery: boolean().default(false).notNull(),
    deviceName: text().notNull(),
    pushNotificationsSentCount: integer().default(0).notNull(),
    pushNotificationsFailedCount: integer().default(0).notNull()
  },
  (table) => [
    index('DecryptionChallenge_deviceId_idx').using(
      'btree',
      table.deviceId.asc().nullsLast()
    ),
    index('DecryptionChallenge_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast()
    )
  ]
)

export const defaultSettings = pgTable(
  'DefaultSettings',
  {
    id: serial().primaryKey(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 }),
    autofillCredentialsEnabled: boolean().default(true).notNull(),
    autofillTOTPEnabled: boolean().default(true).notNull(),
    vaultLockTimeoutSeconds: integer().default(86400).notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    syncTOTP: boolean().default(true).notNull(),
    theme: text().default('dark').notNull()
  },
  (table) => [
    uniqueIndex('DefaultSettings_userId_key').using(
      'btree',
      table.userId.asc().nullsLast()
    )
  ]
)

export const device = pgTable(
  'Device',
  {
    id: text().primaryKey(),
    firstIpAddress: inet().notNull(),
    lastIpAddress: inet().notNull(),
    firebaseToken: text(),
    name: text().notNull(),
    ipAddressLock: boolean().default(false).notNull(),
    vaultLockTimeoutSeconds: integer().notNull(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 }),
    registeredWithMasterAt: timestamp({ precision: 3 }),
    lastSyncAt: timestamp({ precision: 3 }),
    masterPasswordOutdatedAt: timestamp({ precision: 3 }),
    userId: uuid()
      .notNull()
      .references((): AnyPgColumn => user.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    logoutAt: timestamp({ precision: 3 }),
    platform: text().notNull(),
    lastLockAt: timestamp({ precision: 3 }),
    lastUnlockAt: timestamp({ precision: 3 }),
    syncTOTP: boolean().notNull(),
    deletedAt: timestamp({ precision: 3 }),
    autofillCredentialsEnabled: boolean().notNull(),
    autofillTOTPEnabled: boolean().notNull()
  },
  (table) => [
    uniqueIndex('Device_firebaseToken_key').using(
      'btree',
      table.firebaseToken.asc().nullsLast()
    ),
    index('Device_lastSyncAt_idx').using(
      'btree',
      table.lastSyncAt.asc().nullsLast()
    ),
    index('Device_updatedAt_idx').using(
      'btree',
      table.updatedAt.asc().nullsLast()
    ),
    uniqueIndex('Device_userId_id_key').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.id.asc().nullsLast()
    )
  ]
)

export const emailVerification = pgTable(
  'EmailVerification',
  {
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    token: uuid().notNull(),
    address: customType<{ data: string }>({
      dataType: () => 'citext'
    })().primaryKey(),
    kind: emailVerificationType().notNull(),
    verifiedAt: timestamp({ precision: 3 })
  },
  (table) => [
    uniqueIndex('EmailVerification_token_key').using(
      'btree',
      table.token.asc().nullsLast()
    ),
    index('EmailVerification_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast()
    )
  ]
)

export const encryptedSecret = pgTable(
  'EncryptedSecret',
  {
    encrypted: text().notNull(),
    version: integer().notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    kind: encryptedSecretType().notNull(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 }),
    id: uuid().primaryKey(),
    deletedAt: timestamp({ precision: 3 })
  },
  (table) => [
    index('EncryptedSecret_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast()
    )
  ]
)

export const masterDeviceChange = pgTable('MasterDeviceChange', {
  id: text().primaryKey(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  processAt: timestamp({ precision: 3 }).notNull(),
  oldDeviceId: text().notNull(),
  newDeviceId: text().notNull(),
  userId: uuid()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' })
})

export const masterDeviceResetRequest = pgTable(
  'MasterDeviceResetRequest',
  {
    id: serial().primaryKey(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    processAt: timestamp({ precision: 3 }).notNull(),
    confirmedAt: timestamp({ precision: 3 }),
    completedAt: timestamp({ precision: 3 }),
    rejectedAt: timestamp({ precision: 3 }),
    confirmationToken: text().notNull(),
    targetMasterDeviceId: text().notNull(),
    decryptionChallengeId: integer()
      .notNull()
      .references(() => decryptionChallenge.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => [
    uniqueIndex('MasterDeviceResetRequest_decryptionChallengeId_key').using(
      'btree',
      table.decryptionChallengeId.asc().nullsLast()
    ),
    index('MasterDeviceResetRequest_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast()
    ),
    index('MasterDeviceResetRequest_processAt_idx').using(
      'btree',
      table.processAt.asc().nullsLast()
    ),
    uniqueIndex('MasterDeviceResetRequest_confirmationToken_key').using(
      'btree',
      table.confirmationToken.asc().nullsLast()
    )
  ]
)

export const secretUsageEvent = pgTable(
  'SecretUsageEvent',
  {
    id: bigserial({ mode: 'number' }).primaryKey(),
    kind: text().notNull(),
    timestamp: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    ipAddress: inet().notNull(),
    url: text(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    deviceId: text()
      .notNull()
      .references(() => device.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    webInputId: integer().references(() => webInput.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    secretId: uuid()
      .notNull()
      .references(() => encryptedSecret.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade'
      })
  },
  (table) => [
    index('SecretUsageEvent_secretId_idx').using(
      'btree',
      table.secretId.asc().nullsLast()
    )
  ]
)

export const tag = pgTable(
  'Tag',
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => [
    uniqueIndex('Tag_userId_name_key').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.name.asc().nullsLast()
    )
  ]
)

export const token = pgTable(
  'Token',
  {
    id: serial().primaryKey(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 }),
    type: tokenType().notNull(),
    emailToken: text(),
    valid: boolean().default(true).notNull(),
    expiration: timestamp({ precision: 3 }).notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => [
    uniqueIndex('Token_emailToken_key').using(
      'btree',
      table.emailToken.asc().nullsLast()
    ),
    index('Token_userId_idx').using('btree', table.userId.asc().nullsLast())
  ]
)

export const user = pgTable(
  'User',
  {
    id: uuid().primaryKey(),
    email: customType<{ data: string }>({ dataType: () => 'citext' })(),
    tokenVersion: integer().default(0).notNull(),
    username: text(),
    addDeviceSecret: text().notNull(),
    addDeviceSecretEncrypted: text().notNull(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 }),
    masterDeviceId: text().references((): AnyPgColumn => device.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    TOTPlimit: integer('TOTPlimit').notNull(),
    loginCredentialsLimit: integer().notNull(),
    encryptionSalt: text().notNull(),
    deviceRecoveryCooldownMinutes: integer().notNull(),
    recoveryDecryptionChallengeId: integer().references(
      (): AnyPgColumn => decryptionChallenge.id,
      { onDelete: 'set null', onUpdate: 'cascade' }
    ),
    notificationOnVaultUnlock: boolean().default(false).notNull(),
    notificationOnWrongPasswordAttempts: integer().default(3).notNull(),
    uiLanguage: text().default('en').notNull(),
    newDevicePolicy: userNewDevicePolicy()
  },
  (table) => [
    uniqueIndex('User_email_key').using('btree', table.email.asc().nullsLast()),
    uniqueIndex('User_masterDeviceId_key').using(
      'btree',
      table.masterDeviceId.asc().nullsLast()
    ),
    uniqueIndex('User_username_key').using(
      'btree',
      table.username.asc().nullsLast()
    )
  ]
)

export const userPaidProducts = pgTable(
  'UserPaidProducts',
  {
    id: serial().primaryKey(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 }),
    expiresAt: timestamp({ precision: 3 }),
    productId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    checkoutSessionId: text().notNull()
  },
  (table) => [
    index('UserPaidProducts_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast()
    )
  ]
)

export const webInput = pgTable(
  'WebInput',
  {
    id: serial().primaryKey(),
    layoutType: text(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    url: varchar({ length: 2048 }).notNull(),
    kind: webInputType().notNull(),
    domPath: text().notNull(),
    addedByUserId: uuid().references(() => user.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    host: varchar({ length: 253 }).notNull(),
    domOrdinal: integer().default(0).notNull()
  },
  (table) => [
    index('WebInput_host_idx').using('btree', table.host.asc().nullsLast()),
    index('WebInput_kind_idx').using('btree', table.kind.asc().nullsLast()),
    uniqueIndex('WebInput_url_domPath_key').using(
      'btree',
      table.url.asc().nullsLast(),
      table.domPath.asc().nullsLast()
    )
  ]
)
