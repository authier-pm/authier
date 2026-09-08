package dev.authier.android.crypto

import java.nio.ByteBuffer
import java.nio.CharBuffer
import java.nio.charset.CodingErrorAction
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

data class DeviceAuthSecret(
    val addDeviceSecret: String,
    val addDeviceSecretEncrypted: String,
)

/** Interoperates with shared/cryptoUtils.ts; never derives a key from the email. */
object AuthierCrypto {
    private const val ITERATIONS = 600_000
    private const val SALT_BYTES = 16
    private const val IV_BYTES = 12
    private const val KEY_BYTES = 32
    private const val TAG_BYTES = 16
    private val random = SecureRandom()

    fun generateSalt(): String = encodeBase64(randomBytes(SALT_BYTES))

    fun deriveMasterKey(password: String, encryptionSalt: String): SecretKey {
        val salt = decodeSalt(encryptionSalt)
        // Report malformed surrogate pairs instead of silently deriving a different key.
        encodeUtf8(password).fill(0)
        val chars = password.toCharArray()
        val specification = PBEKeySpec(chars, salt, ITERATIONS, KEY_BYTES * 8)
        chars.fill('\u0000')
        val raw = try {
            SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
                .generateSecret(specification).encoded
        } finally {
            specification.clearPassword()
        }
        return SecretKeySpec(raw, "AES").also { raw.fill(0) }
    }

    fun encrypt(key: SecretKey, plaintext: String, encryptionSalt: String): String =
        encryptWithIv(key, plaintext, encryptionSalt, randomBytes(IV_BYTES))

    // Explicitly internal: fixed IVs are exclusively for cross-runtime test vectors.
    internal fun encryptWithIv(
        key: SecretKey,
        plaintext: String,
        encryptionSalt: String,
        iv: ByteArray,
    ): String {
        require(iv.size == IV_BYTES) { "Authier IV must be 12 bytes" }
        val salt = decodeSalt(encryptionSalt)
        val cipher = newCipher(Cipher.ENCRYPT_MODE, key, iv)
        val plainBytes = encodeUtf8(plaintext)
        val encrypted = try {
            cipher.doFinal(plainBytes)
        } finally {
            plainBytes.fill(0)
        }
        return encodeBase64(salt + iv + encrypted)
    }

    fun decrypt(key: SecretKey, envelope: String): String {
        val bytes = decodeBase64(envelope)
        require(bytes.size >= SALT_BYTES + IV_BYTES + TAG_BYTES) {
            "Truncated Authier encrypted payload"
        }
        // Legacy headers are not AAD. The caller already derived key from account salt.
        val iv = bytes.copyOfRange(SALT_BYTES, SALT_BYTES + IV_BYTES)
        val cipher = newCipher(Cipher.DECRYPT_MODE, key, iv)
        val plainBytes = cipher.doFinal(bytes, SALT_BYTES + IV_BYTES, bytes.size - SALT_BYTES - IV_BYTES)
        return try {
            Charsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(plainBytes)).toString()
        } finally {
            plainBytes.fill(0)
        }
    }

    fun createDeviceSecret(key: SecretKey, encryptionSalt: String): DeviceAuthSecret {
        // Server treats this as an opaque secret; the web client's base-36 encoding is not a contract.
        val secret = encodeBase64(randomBytes(KEY_BYTES))
        return DeviceAuthSecret(secret, encrypt(key, secret, encryptionSalt))
    }

    private fun newCipher(mode: Int, key: SecretKey, iv: ByteArray): Cipher {
        require(key.algorithm == "AES") { "Authier requires an AES key" }
        val keyBytes = key.encoded
        require(keyBytes?.size == KEY_BYTES) { "Authier requires a 256-bit key" }
        keyBytes.fill(0)
        return Cipher.getInstance("AES/GCM/NoPadding").apply {
            init(mode, key, GCMParameterSpec(TAG_BYTES * 8, iv))
        }
    }

    private fun decodeSalt(encryptionSalt: String): ByteArray =
        decodeBase64(encryptionSalt).also {
            require(it.size == SALT_BYTES) { "Authier encryption salt must be 16 bytes" }
        }

    private fun decodeBase64(value: String): ByteArray {
        val decoded = Base64.getDecoder().decode(value)
        require(encodeBase64(decoded) == value) { "Expected canonical standard Base64" }
        return decoded
    }

    private fun encodeBase64(bytes: ByteArray): String = Base64.getEncoder().encodeToString(bytes)

    private fun randomBytes(size: Int): ByteArray = ByteArray(size).also(random::nextBytes)

    private fun encodeUtf8(value: String): ByteArray {
        val encoded = Charsets.UTF_8.newEncoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
            .encode(CharBuffer.wrap(value))
        return ByteArray(encoded.remaining()).also(encoded::get)
    }
}
