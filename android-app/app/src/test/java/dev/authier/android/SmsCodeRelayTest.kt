package dev.authier.android

import dev.authier.android.crypto.AuthierCrypto
import java.util.Base64
import javax.crypto.spec.SecretKeySpec
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class SmsCodeRelayTest {
    private val key = SecretKeySpec(ByteArray(32) { it.toByte() }, "AES")
    private val salt = Base64.getEncoder().encodeToString(ByteArray(16) { 7 })

    @Test fun `encrypts exactly the payload the browser extension parses`() {
        val encrypted = SmsCodeRelay.encrypt(key, salt, "474230", " Air\nBank ", 1_790_000_000_000)
        // shared/relayedVerificationCode.ts: relayedCodePayloadSchema
        assertEquals(
            Json.parseToJsonElement("""{"v":1,"code":"474230","sender":"Air Bank","receivedAt":1790000000000}"""),
            Json.parseToJsonElement(AuthierCrypto.decrypt(key, encrypted)),
        )
        assertNotEquals(encrypted, SmsCodeRelay.encrypt(key, salt, "474230", "Air Bank", 1_790_000_000_000))
    }

    @Test fun `keeps sender labels within the browser's single-line limit`() {
        assertEquals("Unknown sender", SmsCodeRelay.senderLabel(" \n "))
        assertEquals("+420 777 123 456", SmsCodeRelay.senderLabel("+420 777\t123 456"))
        assertEquals(64, SmsCodeRelay.senderLabel("x".repeat(200)).length)
    }
}
