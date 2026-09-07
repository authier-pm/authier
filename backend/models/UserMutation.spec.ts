import type { InferSelectModel } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { db } from "../prisma/prismaClient";
import { faker } from "@faker-js/faker";
import { plainToClass } from "class-transformer";
import { makeFakeCtx } from "../tests/makeFakeCtx";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UserMutation } from "./UserMutation";
import { EncryptedSecretTypeGQL } from "./types/EncryptedSecretType";
import type { EncryptedSecretInput, SettingsInput } from "./models";
import { defaultDeviceSettingSystemValues } from "./defaultDeviceSettingSystemValues";
import { graphql } from "graphql";
import { sign } from "jsonwebtoken";
import { gqlSchema } from "../schemas/gqlSchema";

type User = InferSelectModel<typeof schema.user>;

describe("UserMutation", () => {
  const masterDeviceId = crypto.randomUUID();
  const masterDeviceName = faker.lorem.word();
  let userRaw: User;
  beforeAll(async () => {
    const [insertedUser] = await db
      .insert(schema.user)
      .values({
        email: `${crypto.randomUUID()}@test.com`,
        id: crypto.randomUUID(),
        loginCredentialsLimit: 3,
        TOTPlimit: 3,
        deviceRecoveryCooldownMinutes: 960,
        addDeviceSecret: faker.string.sample(5),
        addDeviceSecretEncrypted: faker.string.sample(5),
        encryptionSalt: faker.string.sample(5),
      })
      .returning();
    userRaw = insertedUser;

    await db.insert(schema.device).values({
      id: masterDeviceId,
      userId: userRaw.id,
      name: masterDeviceName,
      firebaseToken: crypto.randomUUID(),
      firstIpAddress: faker.internet.ip(),
      lastIpAddress: faker.internet.ip(),
      platform: "ios",
      ...defaultDeviceSettingSystemValues,
    });
  });

  afterAll(async () => {
    await db
      .delete(schema.encryptedSecret)
      .where(eq(schema.encryptedSecret.userId, userRaw.id));
    await db.delete(schema.device).where(eq(schema.device.userId, userRaw.id));
    await db.delete(schema.user).where(eq(schema.user.id, userRaw.id));
  });

  describe("updateEmail", () => {
    it("should update email", async () => {
      const [updated] = await db
        .update(schema.user)
        .set({
          masterDeviceId,
        })
        .where(eq(schema.user.id, userRaw.id))
        .returning();
      userRaw = updated;

      const user = plainToClass(UserMutation, userRaw);

      const newEmail = faker.internet.email();
      const res = await user.changeEmail(
        newEmail,
        makeFakeCtx({
          userId: user.id,
          device: {
            id: masterDeviceId,
          } as Parameters<typeof makeFakeCtx>[0]["device"],
        }),
      );

      expect(res.email).toBe(newEmail);
      // expect(sentEmails.length).toBe(1) // TODO figure out why this is not working
    });
  });

  describe("changeMasterPassword", () => {
    it.todo(
      "should change master password and increment token version to force user to relog on all other devices",
    );

    it.todo("should throw error when user is not ona master device");
  });

  describe("Secret manipulation", async () => {
    const testData: EncryptedSecretInput[] = [];
    const removeSecrets = (secrets: string[]) => {
      const ctx = makeFakeCtx({ userId: userRaw.id });
      ctx.request.cookies = {
        "access-token": sign(
          { userId: userRaw.id, deviceId: masterDeviceId, tokenVersion: 0 },
          process.env.ACCESS_TOKEN_SECRET!,
        ),
      };
      return graphql({
        schema: gqlSchema,
        source: `mutation RemoveSecrets($secrets: [UUID!]!) {
          me { removeEncryptedSecrets(secrets: $secrets) { id } }
        }`,
        variableValues: { secrets },
        contextValue: ctx,
      });
    };

    it("should add secrets", async () => {
      const user = plainToClass(UserMutation, userRaw);
      for (let i = 0; i < user.loginCredentialsLimit; i++) {
        testData.push({
          encrypted: faker.string.sample(25),
          kind: EncryptedSecretTypeGQL.LOGIN_CREDENTIALS,
        });
      }

      const data = await user.addEncryptedSecrets(
        testData,
        makeFakeCtx({ userId: userRaw.id }),
      );

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(user.loginCredentialsLimit);
      testData.forEach((testSecret, i) => {
        expect(data[i]).toEqual(
          expect.objectContaining({
            encrypted: testSecret.encrypted,
            kind: testSecret.kind,
            version: 1,
            id: expect.any(String),
            createdAt: expect.any(Date),
            userId: userRaw.id,
          }),
        );
      });
    });

    it("deletes two selected credentials through GraphQL", async () => {
      const dataInDB = await db.query.encryptedSecret.findMany({
        where: { userId: userRaw.id },
      });

      const input = dataInDB.slice(0, 2).map((secret) => secret.id);

      expect(input).toHaveLength(2);
      const result = await removeSecrets(input);
      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        me: {
          removeEncryptedSecrets: expect.arrayContaining(
            input.map((id) => ({ id })),
          ),
        },
      });
      expect(result.data).toHaveProperty("me.removeEncryptedSecrets.length", 2);

      const dataInDBAfter = await db.query.encryptedSecret.findMany({
        where: { userId: userRaw.id },
      });

      dataInDBAfter.forEach((secret) => {
        if (input.includes(secret.id)) {
          expect(secret.deletedAt).toBeInstanceOf(Date);
        } else {
          expect(secret.deletedAt).toBeNull();
        }
      });
    });

    it("accepts an empty batch through GraphQL", async () => {
      const result = await removeSecrets([]);
      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ me: { removeEncryptedSecrets: [] } });
    });

    it("rejects invalid UUIDs through GraphQL", async () => {
      const result = await removeSecrets(["not-a-uuid"]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain("UUID");
      expect(result.data).toBeUndefined();
    });
  });
  describe("updateSettings", () => {
    it("Should update settings", async () => {
      const user = plainToClass(UserMutation, userRaw);

      const newSettings: SettingsInput = {
        syncTOTP: true,
        vaultLockTimeoutSeconds: 3600,
        uiLanguage: "cs",
        autofillTOTPEnabled: false,
        autofillForbiddenUrlPatterns:
          "www.google.com/my-path/*\nhttps://internal.test/*",
        notificationOnVaultUnlock: false,
        notificationOnWrongPasswordAttempts: 3,
      };

      const ctx = makeFakeCtx({
        userId: user.id,
        device: {
          id: masterDeviceId,
        } as Parameters<typeof makeFakeCtx>[0]["device"],
      });

      const res = await user.updateSettings(newSettings, ctx);

      const deviceData = await db.query.device.findFirst({
        where: { id: masterDeviceId },
      });
      //TODO: Eventually add all settings
      expect(res.uiLanguage).toBe(newSettings.uiLanguage);
      expect(deviceData?.vaultLockTimeoutSeconds).toBe(
        newSettings.vaultLockTimeoutSeconds,
      );
      expect(deviceData?.syncTOTP).toBe(newSettings.syncTOTP);
      expect(res.autofillForbiddenUrlPatterns).toBe(
        newSettings.autofillForbiddenUrlPatterns,
      );

      const {
        autofillForbiddenUrlPatterns: omittedAutofillForbiddenUrlPatterns,
        ...legacySettings
      } = newSettings;
      expect(omittedAutofillForbiddenUrlPatterns).toBeDefined();

      const userWithUpdatedSettings = plainToClass(UserMutation, res);
      await userWithUpdatedSettings.updateSettings(legacySettings, ctx);

      const userDataAfterLegacyUpdate = await db.query.user.findFirst({
        where: { id: user.id },
      });
      expect(userDataAfterLegacyUpdate?.autofillForbiddenUrlPatterns).toBe(
        newSettings.autofillForbiddenUrlPatterns,
      );
    });
  });

  describe("delete", () => {
    it.todo("should delete user", async () => {});
  });
});
