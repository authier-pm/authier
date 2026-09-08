package dev.authier.android

import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

/** Exercise generated Kotlin serialization through real HTTP, including nullable/union types. */
class ApiFacadeTest {
    private lateinit var server: MockWebServer
    private lateinit var api: ApiFacade

    @Before fun setup() {
        server = MockWebServer().apply { start() }
        api = ApiFacade(server.url("/").toString(), "current-device")
    }
    @After fun close() { server.shutdown() }
    private fun respond(body: String, status: Int = 200) {
        server.enqueue(MockResponse().setResponseCode(status).setHeader("Content-Type", "application/json").setBody(body))
    }

    @Test fun `decodes both generated challenge variants`() = runTest {
        respond("""{"status":"pending","challengeId":12,"pushNotificationsSentCount":0,"pushNotificationsFailedCount":0,"masterDeviceResetRequestedAt":null,"masterDeviceResetProcessAt":null,"masterDeviceResetConfirmedAt":null,"masterDeviceResetRejectedAt":null}""")
        val pending = api.challenge("test@example.com", "device", "Pixel")
        assertEquals("pending", pending.status)
        assertNull(pending.encryptionSalt)
        val request = server.takeRequest()
        assertEquals("/api/v1/auth/requestDeviceChallenge", request.path)
        assertEquals("android", Json.parseToJsonElement(request.body.readUtf8()).jsonObject["deviceInput"]!!.jsonObject["platform"]!!.jsonPrimitive.content)

        respond("""{"status":"approved","challengeId":12,"userId":"a9e460fa-a93e-4993-b863-97d4353b60e7","deviceId":"device","deviceName":"Pixel","approvedAt":"2026-09-08T10:00:00.000Z","addDeviceSecretEncrypted":"encrypted-verifier","encryptionSalt":"salt","futureField":true}""")
        val approved = api.challenge("test@example.com", "device", "Pixel")
        assertEquals("approved", approved.status)
        assertEquals("salt", approved.encryptionSalt)
        assertEquals("encrypted-verifier", approved.addDeviceSecretEncrypted)
    }

    @Test fun `sends empty JSON input and bearer auth without a JS serializer`() = runTest {
        api.accessToken = "test-token"
        respond("""{"security":{"newDevicePolicy":"ALLOW","deviceRecoveryCooldownMinutes":60,"masterDeviceId":null,"vaultLockTimeoutSeconds":300}}""")
        val security = api.security()
        assertEquals("ALLOW", security.newDevicePolicy)
        assertNull(security.masterDeviceId)
        val request = server.takeRequest()
        assertEquals("/api/v1/security/get", request.path)
        assertEquals("Bearer test-token", request.getHeader("Authorization"))
        assertEquals("{}", request.body.readUtf8())
        respond("""{"ok":true}""")
        api.logout()
        assertEquals("/api/v1/auth/logout", server.takeRequest().path)
    }

    @Test fun `keeps a mutation id stable when resending and maps deletion records`() = runTest {
        val body = """{"id":"a9e460fa-a93e-4993-b863-97d4353b60e7","encrypted":"ciphertext","kind":"LOGIN_CREDENTIALS","version":3,"createdAt":"2026-09-08T10:00:00.000Z","updatedAt":"2026-09-08T11:00:00.000Z","deletedAt":"2026-09-08T11:00:00.000Z"}"""
        val operation = PendingWrite(operation = "delete", id = "a9e460fa-a93e-4993-b863-97d4353b60e7", expectedVersion = 2)
        respond(body)
        respond(body)
        assertNotNull(api.write(operation).deletedAt)
        assertEquals(3, api.write(operation).version)
        val first = server.takeRequest()
        val retry = server.takeRequest()
        assertEquals("/api/v1/vault/delete", first.path)
        assertEquals(first.body.readUtf8(), retry.body.readUtf8())
    }

    @Test fun `decodes redacted tombstones and preserves the server cursor`() = runTest {
        respond("""{"changes":[{"cursor":"account-device-8","secret":{"id":"a9e460fa-a93e-4993-b863-97d4353b60e7","encrypted":"","kind":"TOTP","version":2,"createdAt":"2026-09-08T10:00:00.000Z","updatedAt":null,"deletedAt":"2026-09-08T11:00:00.000Z"}}],"nextCursor":"account-device-8","hasMore":false}""")
        val page = api.sync("account-device-7")
        assertEquals("account-device-8", page.nextCursor)
        assertEquals("", page.changes.single().encrypted)
        assertNotNull(page.changes.single().deletedAt)
        assertFalse(page.hasMore)
    }

    @Test fun `omits absent optional cursor on initial sync`() = runTest {
        respond("""{"changes":[],"nextCursor":"account-all-0","hasMore":false}""")
        assertEquals("account-all-0", api.sync(null).nextCursor)
        val body = Json.parseToJsonElement(server.takeRequest().body.readUtf8()).jsonObject
        assertFalse(body.containsKey("cursor"))
        assertEquals("200", body["limit"]!!.jsonPrimitive.content)
    }

    @Test fun `accepts opaque passkeys in bootstrap and sync alongside passwords`() = runTest {
        val passkey = """{"id":"passkey-id","encrypted":"opaque-signing-key-ciphertext","kind":"PASSKEY","version":1,"createdAt":"2026-09-08T10:00:00.000Z","updatedAt":null}"""
        val password = """{"id":"password-id","encrypted":"password-ciphertext","kind":"LOGIN_CREDENTIALS","version":1,"createdAt":"2026-09-08T10:00:00.000Z","updatedAt":null}"""
        respond("""{"user":{"id":"account","email":"test@example.com","masterDeviceId":null,"newDevicePolicy":null,"deviceRecoveryCooldownMinutes":60},"currentDevice":{"id":"current-device","name":"Pixel","platform":"android","syncTOTP":false,"vaultLockTimeoutSeconds":300,"createdAt":"2026-09-08T10:00:00.000Z","lastSyncAt":null,"logoutAt":null},"secrets":[$passkey,$password],"pendingChallenges":[]}""")
        val bootstrap = api.bootstrap()
        assertEquals(listOf("PASSKEY", "LOGIN_CREDENTIALS"), bootstrap.secrets.map { it.kind })
        assertEquals("opaque-signing-key-ciphertext", bootstrap.secrets.first().encrypted)

        val tombstone = passkey.dropLast(1) + """, "deletedAt":"2026-09-08T11:00:00.000Z"}"""
        respond("""{"changes":[{"cursor":"revision-2","secret":$tombstone}],"nextCursor":"revision-2","hasMore":false}""")
        val page = api.sync(null)
        assertEquals("PASSKEY", page.changes.single().kind)
        assertEquals("opaque-signing-key-ciphertext", page.changes.single().encrypted)
        assertNotNull(page.changes.single().deletedAt)
    }

    @Test fun `preserves typed error code and conflict status`() = runTest {
        respond("""{"code":"CURSOR_INVALID","status":400,"message":"Start sync again"}""", 400)
        val error = try { api.sync("expired"); error("Expected API failure") } catch (failure: ApiFailure) { failure }
        assertEquals(400, error.status)
        assertEquals("CURSOR_INVALID", error.code)
        assertNotNull(error.cause)
    }
}
