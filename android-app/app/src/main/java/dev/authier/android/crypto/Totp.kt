package dev.authier.android.crypto

import java.nio.ByteBuffer
import java.util.Locale
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/** RFC 6238 with millisecond timestamps, matching JavaScript Date.now(). */
object Totp {
    private const val ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    fun generate(
        secret: String,
        algorithm: String = "SHA1",
        digits: Int = 6,
        period: Int = 30,
        now: Long = System.currentTimeMillis(),
    ): String {
        require(digits in 6..8) { "TOTP supports 6 to 8 digits" }
        require(period > 0) { "TOTP period must be positive" }
        require(now >= 0) { "TOTP time must not precede the Unix epoch" }
        val hmac = when (algorithm.uppercase(Locale.ROOT).replace("-", "")) {
            "SHA1" -> "HmacSHA1"
            "SHA256" -> "HmacSHA256"
            "SHA512" -> "HmacSHA512"
            else -> throw IllegalArgumentException("Unsupported TOTP algorithm")
        }
        val counter = ByteBuffer.allocate(8).putLong(now / 1000 / period).array()
        val key = decodeBase32(secret)
        val signature = try {
            Mac.getInstance(hmac).run {
                init(SecretKeySpec(key, hmac))
                doFinal(counter)
            }
        } finally {
            key.fill(0)
        }
        val offset = signature.last().toInt() and 15
        val binary = ByteBuffer.wrap(signature, offset, 4).int and Int.MAX_VALUE
        var modulus = 1
        repeat(digits) { modulus *= 10 }
        return (binary % modulus).toString().padStart(digits, '0')
    }

    fun remainingSeconds(period: Int = 30, now: Long = System.currentTimeMillis()): Int {
        require(period > 0) { "TOTP period must be positive" }
        require(now >= 0) { "TOTP time must not precede the Unix epoch" }
        return period - (now / 1000 % period).toInt()
    }

    private fun decodeBase32(secret: String): ByteArray {
        val normalized = secret.uppercase(Locale.ROOT)
            .filterNot { it.isWhitespace() || it == '=' || it == '-' }
        require(normalized.isNotEmpty()) { "TOTP secret must not be empty" }
        val output = ByteArray(normalized.length * 5 / 8)
        var value = 0
        var bits = 0
        var offset = 0
        for (character in normalized) {
            val digit = ALPHABET.indexOf(character)
            require(digit >= 0) { "TOTP secret is not valid Base32" }
            value = (value shl 5) or digit
            bits += 5
            if (bits >= 8) {
                bits -= 8
                output[offset++] = (value shr bits).toByte()
                value = value and ((1 shl bits) - 1)
            }
        }
        require(output.isNotEmpty()) { "TOTP secret must contain at least one byte" }
        return output
    }
}
