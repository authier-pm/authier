package dev.authier.android

import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.*
import org.junit.Test
import javax.crypto.spec.SecretKeySpec

class AutofillAssociationTest {
    private val key = SecretKeySpec(ByteArray(32) { it.toByte() }, "AES")
    private val salt = AuthierCrypto.generateSalt()
    private val original = """{"label":"GitHub","username":"autofill-demo","password":"autofill-demo-password","url":"https://github.com","androidUri":"com.previous.app","customFields":[{"name":"note","value":"keep me"}]}"""
    private val record = SecretRecord("login", AuthierCrypto.encrypt(key, original, salt), "LOGIN_CREDENTIALS", 7, "2026-09-08T00:00:00Z")
    private val item = VaultItem(record, SecretContentDecoder.decode(original, record.kind))
    private val snapshot = VaultSnapshot(email = "synthetic@example.com", encryptionSalt = salt,
        authSecretEncrypted = AuthierCrypto.encrypt(key, "auth-secret", salt), secrets = listOf(record))

    @Test
    fun `link is encrypted queued and preserves every unrelated payload field`() {
        val otherWrite = PendingWrite(operation = "delete", id = "other", expectedVersion = 2)
        val current = snapshot.copy(outbox = listOf(otherWrite), cursor = "newer-cursor")
        val saved = associateAutofillLogin(current, snapshot, item, key, "com.github.android")
        val payload = vaultJson.parseToJsonElement(AuthierCrypto.decrypt(key, saved.secrets.single().encrypted)) as JsonObject
        val expected = (vaultJson.parseToJsonElement(original) as JsonObject) + ("androidUri" to JsonPrimitive("com.github.android"))
        assertEquals(JsonObject(expected), payload)
        assertEquals("newer-cursor", saved.cursor)
        assertEquals(otherWrite, saved.outbox.first())
        val update = saved.outbox.last()
        assertEquals("update", update.operation)
        assertEquals(7, update.expectedVersion)
        assertEquals(saved.secrets.single().encrypted, update.encrypted)
        assertFalse(vaultJson.encodeToString(saved).contains("autofill-demo-password"))
        assertFalse(vaultJson.encodeToString(saved).contains("com.github.android"))
        assertTrue(NativeAutofillTarget.matchesAssociation(SecretContentDecoder.decode(payload.toString(), record.kind).androidUri, "com.github.android"))
    }

    @Test
    fun `pending writes including conflicts cannot have their idempotent payload replaced`() {
        for (conflict in listOf(false, true)) {
            val pending = PendingWrite(operation = "update", id = record.id, encrypted = record.encrypted, conflict = conflict)
            assertThrows(IllegalArgumentException::class.java) {
                associateAutofillLogin(snapshot.copy(outbox = listOf(pending)), snapshot, item, key, "com.github.android")
            }
        }
    }

    @Test
    fun `changed removed deleted and non-login items cannot be filled or linked`() {
        val changedSnapshots = listOf(
            snapshot.copy(secrets = emptyList()),
            snapshot.copy(secrets = listOf(record.copy(version = 8))),
            snapshot.copy(secrets = listOf(record.copy(encrypted = "changed"))),
            snapshot.copy(secrets = listOf(record.copy(deletedAt = "now"))),
            snapshot.copy(email = "other@example.com"),
            snapshot.copy(deviceId = "other"),
            snapshot.copy(serverUrl = "https://other.example"),
            snapshot.copy(encryptionSalt = AuthierCrypto.generateSalt()),
            snapshot.copy(authSecretEncrypted = "rotated"),
        )
        for (changed in changedSnapshots) assertThrows(IllegalArgumentException::class.java) {
            validateAutofillSelection(changed, snapshot, item)
        }
        val totp = record.copy(kind = "TOTP")
        assertThrows(IllegalArgumentException::class.java) {
            validateAutofillSelection(snapshot.copy(secrets = listOf(totp)), snapshot, item.copy(record = totp))
        }
    }

    @Test
    fun `invalid targets cannot be stored`() {
        for (target in listOf("", "https://github.com", "com.github.*", "androidapp://com.github.android")) {
            assertThrows(IllegalArgumentException::class.java) {
                associateAutofillLogin(snapshot, snapshot, item, key, target)
            }
        }
    }
}
