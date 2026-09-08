package dev.authier.android.crypto

import java.io.File
import java.security.GeneralSecurityException
import java.util.Base64
import javax.crypto.spec.SecretKeySpec
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class AuthierCryptoTest {
    private val vectors = Json.parseToJsonElement(
        File(System.getProperty("authier.cryptoVectors", "../../shared/cryptoTestVectors.json")).readText(),
    ).jsonObject.getValue("vectors").jsonArray.map { element ->
        element.jsonObject.mapValues { (_, value) -> value.jsonPrimitive.content }
    }

    @Test
    fun `derivation and encryption match every WebCrypto vector byte for byte`() {
        for (vector in vectors) {
            val key = AuthierCrypto.deriveMasterKey(vector.getValue("password"), vector.getValue("salt"))
            assertEquals(vector.getValue("id"), vector.getValue("key"), encode(key.encoded))
            assertEquals(vector.getValue("passwordUtf8"), encode(vector.getValue("password").toByteArray(Charsets.UTF_8)))
            assertEquals(vector.getValue("plaintext"), AuthierCrypto.decrypt(key, vector.getValue("envelope")))
            assertEquals(
                vector.getValue("envelope"),
                AuthierCrypto.encryptWithIv(
                    key,
                    vector.getValue("plaintext"),
                    vector.getValue("salt"),
                    decode(vector.getValue("iv")),
                ),
            )
        }
    }

    @Test
    fun `each encryption uses a fresh IV and enrollment secret remains decryptable`() {
        val vector = vectors.first()
        val key = key(vector)
        val first = AuthierCrypto.encrypt(key, vector.getValue("plaintext"), vector.getValue("salt"))
        val second = AuthierCrypto.encrypt(key, vector.getValue("plaintext"), vector.getValue("salt"))
        assertNotEquals(first, second)
        assertEquals(vector.getValue("plaintext"), AuthierCrypto.decrypt(key, first))
        assertEquals(vector.getValue("plaintext"), AuthierCrypto.decrypt(key, second))
        val secret = AuthierCrypto.createDeviceSecret(key, vector.getValue("salt"))
        val nextSecret = AuthierCrypto.createDeviceSecret(key, vector.getValue("salt"))
        assertEquals(32, decode(secret.addDeviceSecret).size)
        assertEquals(secret.addDeviceSecret, AuthierCrypto.decrypt(key, secret.addDeviceSecretEncrypted))
        assertNotEquals(secret.addDeviceSecret, nextSecret.addDeviceSecret)
        val salt = AuthierCrypto.generateSalt()
        assertEquals(16, decode(salt).size)
        assertNotEquals(salt, AuthierCrypto.generateSalt())
    }

    @Test
    fun `rejects modifications to IV ciphertext and authentication tag`() {
        val vector = vectors.first()
        val original = decode(vector.getValue("envelope"))
        for (offset in listOf(16, 28, original.lastIndex)) {
            val modified = original.copyOf()
            modified[offset] = (modified[offset].toInt() xor 1).toByte()
            assertThrows(GeneralSecurityException::class.java) {
                AuthierCrypto.decrypt(key(vector), encode(modified))
            }
        }
    }

    @Test
    fun `wrong password and malformed payloads never return plaintext`() {
        val vector = vectors.first()
        val wrongKey = AuthierCrypto.deriveMasterKey("wrong-password", vector.getValue("salt"))
        assertThrows(GeneralSecurityException::class.java) {
            AuthierCrypto.decrypt(wrongKey, vector.getValue("envelope"))
        }
        for (invalid in listOf("", "%%%", encode(ByteArray(43)), vector.getValue("envelope") + "\n")) {
            assertThrows(IllegalArgumentException::class.java) { AuthierCrypto.decrypt(key(vector), invalid) }
        }
        assertThrows(IllegalArgumentException::class.java) {
            AuthierCrypto.deriveMasterKey("password", encode(ByteArray(15)))
        }
        assertThrows(IllegalArgumentException::class.java) {
            AuthierCrypto.encrypt(SecretKeySpec(ByteArray(16), "AES"), "value", vector.getValue("salt"))
        }
    }

    @Test
    fun `Unicode passwords are not normalized`() {
        assertFalse(vectors[2].getValue("password").equals(vectors[3].getValue("password")))
        assertNotEquals(vectors[2].getValue("key"), vectors[3].getValue("key"))
    }

    @Test
    fun `legacy salt header is metadata and does not choose the key`() {
        val vector = vectors.first()
        val modified = decode(vector.getValue("envelope"))
        modified[0] = (modified[0].toInt() xor 1).toByte()
        assertEquals(vector.getValue("plaintext"), AuthierCrypto.decrypt(key(vector), encode(modified)))
    }

    private fun key(vector: Map<String, String>) = SecretKeySpec(decode(vector.getValue("key")), "AES")
    private fun decode(value: String): ByteArray = Base64.getDecoder().decode(value)
    private fun encode(value: ByteArray): String = Base64.getEncoder().encodeToString(value)
}
