package dev.authier.android.crypto

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class TotpTest {
    private val sha1Secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

    @Test
    fun `matches RFC 6238 appendix B including 64-bit timestamps`() {
        val algorithms = listOf("SHA1", "SHA256", "SHA512")
        val secrets = listOf(
            sha1Secret,
            "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA",
            "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA",
        )
        // https://www.rfc-editor.org/rfc/rfc6238.html#appendix-B
        val cases = listOf(
            59L to listOf("94287082", "46119246", "90693936"),
            1_111_111_109L to listOf("07081804", "68084774", "25091201"),
            1_111_111_111L to listOf("14050471", "67062674", "99943326"),
            1_234_567_890L to listOf("89005924", "91819424", "93441116"),
            2_000_000_000L to listOf("69279037", "90698825", "38618901"),
            20_000_000_000L to listOf("65353130", "77737706", "47863826"),
        )
        for ((seconds, expected) in cases) {
            algorithms.forEachIndexed { index, algorithm ->
                assertEquals(
                    "$algorithm at $seconds",
                    expected[index],
                    Totp.generate(secrets[index], algorithm, digits = 8, now = seconds * 1000),
                )
            }
        }
    }

    @Test
    fun `supports existing short secrets and common Base32 formatting`() {
        assertEquals("996554", Totp.generate("JBSWY3DPEHPK3PXP", now = 59_000))
        assertEquals("996554", Totp.generate(" jbsw-y3dp ehpk3pxp===\n", now = 59_000))
        assertEquals("287082", Totp.generate(sha1Secret, now = 59_000))
    }

    @Test
    fun `does not advance codes half a second early`() {
        val secret = "JBSWY3DPEHPK3PXP"
        val before = Totp.generate(secret, now = 59_000)
        assertEquals(before, Totp.generate(secret, now = 59_500))
        assertEquals(before, Totp.generate(secret, now = 59_999))
        assertNotEquals(before, Totp.generate(secret, now = 60_000))
        assertEquals(1, Totp.remainingSeconds(now = 59_999))
        assertEquals(30, Totp.remainingSeconds(now = 60_000))
    }

    @Test
    fun `rejects invalid options instead of displaying a plausible wrong code`() {
        for (invalid in listOf("", "___", "A", "ABC!")) {
            assertThrows(IllegalArgumentException::class.java) { Totp.generate(invalid) }
        }
        assertThrows(IllegalArgumentException::class.java) { Totp.generate(sha1Secret, algorithm = "MD5") }
        assertThrows(IllegalArgumentException::class.java) { Totp.generate(sha1Secret, digits = 9) }
        assertThrows(IllegalArgumentException::class.java) { Totp.generate(sha1Secret, period = 0) }
        assertThrows(IllegalArgumentException::class.java) { Totp.generate(sha1Secret, now = -1) }
    }
}
